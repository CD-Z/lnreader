package expo.modules.nativebackgroundtasks

import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import androidx.work.CoroutineWorker
import androidx.work.ForegroundInfo
import androidx.work.WorkerParameters
import kotlinx.coroutines.CancellationException

class LNReaderTaskWorker(
    appContext: Context,
    workerParams: WorkerParameters,
) : CoroutineWorker(appContext, workerParams) {
    override suspend fun doWork(): Result {
        val taskId = inputData.getString(BackgroundTaskScheduler.TASK_ID) ?: return Result.failure()
        val dao = BackgroundTaskDatabase.get(applicationContext).tasks()
        val task = dao.get(taskId) ?: return Result.failure()
        if (task.state == BackgroundTaskState.CANCELLED) {
            dao.delete(taskId)
            return Result.success()
        }
        if (task.state == BackgroundTaskState.PAUSED) {
            return Result.success()
        }

        val claimed = dao.tryMarkRunning(
            taskId,
            BackgroundTaskState.RUNNING,
            System.currentTimeMillis(),
            MAX_CONCURRENT_DOWNLOADS,
        )
        if (claimed == 0) {
            return if (dao.get(taskId)?.state == BackgroundTaskState.QUEUED) {
                Result.retry()
            } else {
                Result.success()
            }
        }
        val runningTask = dao.get(taskId) ?: return Result.failure()
        setForeground(createForegroundInfo(runningTask))
        val execution = TaskExecutionRegistry.register(taskId)

        return try {
            applicationContext.startService(
                Intent(applicationContext, LNReaderHeadlessTaskService::class.java).apply {
                    putExtra(BackgroundTaskScheduler.TASK_ID, runningTask.id)
                },
            )

            when (val executionResult = execution.await()) {
                TaskExecutionResult.Success -> {
                    val currentState = dao.get(taskId)?.state
                    if (currentState == BackgroundTaskState.CANCELLED) {
                        TaskNotificationFactory.dismiss(applicationContext, taskId)
                        dao.delete(taskId)
                        return Result.success()
                    }
                    if (currentState == BackgroundTaskState.PAUSED) {
                        dao.get(taskId)?.let { TaskNotificationFactory.update(applicationContext, it) }
                        return Result.success()
                    }
                    dao.finishRunning(taskId, BackgroundTaskState.SUCCEEDED, System.currentTimeMillis())
                    dao.get(taskId)?.let {
                        TaskNotificationFactory.postTerminal(applicationContext, it)
                    }
                    dao.delete(taskId)
                    Result.success()
                }
                is TaskExecutionResult.Failure -> {
                    val currentState = dao.get(taskId)?.state
                    if (currentState == BackgroundTaskState.PAUSED || currentState == BackgroundTaskState.CANCELLED) {
                        if (currentState == BackgroundTaskState.CANCELLED) {
                            dao.delete(taskId)
                        }
                        return Result.success()
                    }
                    if (executionResult.shouldRetry) {
                        dao.updateState(taskId, BackgroundTaskState.QUEUED, System.currentTimeMillis())
                        Result.retry()
                    } else {
                        dao.updateState(taskId, BackgroundTaskState.FAILED, System.currentTimeMillis())
                        dao.get(taskId)?.let {
                            TaskNotificationFactory.postTerminal(applicationContext, it)
                        }
                        dao.delete(taskId)
                        Result.success()
                    }
                }
            }
        } catch (error: CancellationException) {
            val latestState = dao.get(taskId)?.state
            when (latestState) {
                BackgroundTaskState.CANCELLED -> dao.delete(taskId)
                BackgroundTaskState.PAUSED -> Unit
                else -> dao.updateState(
                    taskId,
                    BackgroundTaskState.QUEUED,
                    System.currentTimeMillis(),
                )
            }
            throw error
        } catch (error: Exception) {
            val latestState = dao.get(taskId)?.state
            if (latestState !in listOf(BackgroundTaskState.PAUSED, BackgroundTaskState.CANCELLED)) {
                val now = System.currentTimeMillis()
                val message = error.message ?: error.javaClass.simpleName
                dao.updateProgress(taskId, null, message, now)
                dao.updateState(taskId, BackgroundTaskState.FAILED, now)
                dao.get(taskId)?.let {
                    TaskNotificationFactory.postTerminal(applicationContext, it)
                }
            }
            if (latestState != BackgroundTaskState.PAUSED) {
                dao.delete(taskId)
            }
            Result.failure()
        } finally {
            TaskExecutionRegistry.cancel(taskId)
        }
    }

    private fun createForegroundInfo(task: BackgroundTaskEntity): ForegroundInfo {
        val id = TaskNotificationFactory.notificationId(task.id)
        val notification = TaskNotificationFactory.build(applicationContext, task)
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            ForegroundInfo(id, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC)
        } else {
            ForegroundInfo(id, notification)
        }
    }

    companion object {
        private const val MAX_CONCURRENT_DOWNLOADS = 3
    }
}
