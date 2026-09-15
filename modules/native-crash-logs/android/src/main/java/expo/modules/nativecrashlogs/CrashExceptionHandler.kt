package expo.modules.nativecrashlogs

import android.content.Context
import android.os.Process
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import kotlin.system.exitProcess

internal class CrashExceptionHandler private constructor(
    private val applicationContext: Context,
    private val defaultHandler: Thread.UncaughtExceptionHandler?,
) : Thread.UncaughtExceptionHandler {
    override fun uncaughtException(thread: Thread, exception: Throwable) {
        try {
            val recordedJsCrash = CrashLogStore.readPendingCrash(applicationContext)
            CrashLogStore.writePendingCrash(
                applicationContext,
                buildString {
                    appendLine("Native crash captured: ${timestamp()}")
                    appendLine("Thread: ${thread.name}")
                    appendLine()
                    append(exception.stackTraceToString())
                    if (recordedJsCrash != null) {
                        appendLine()
                        appendLine()
                        appendLine("Previously recorded JavaScript crash:")
                        append(recordedJsCrash)
                    }
                },
            )
        } catch (_: Throwable) {
            // The platform handler must still terminate the process normally.
        } finally {
            val handler = defaultHandler
            if (handler != null) {
                handler.uncaughtException(thread, exception)
            } else {
                Process.killProcess(Process.myPid())
                exitProcess(10)
            }
        }
    }

    companion object {
        fun install(context: Context) {
            val currentHandler = Thread.getDefaultUncaughtExceptionHandler()
            if (currentHandler is CrashExceptionHandler) return
            Thread.setDefaultUncaughtExceptionHandler(
                CrashExceptionHandler(context.applicationContext, currentHandler),
            )
        }

        private fun timestamp(): String =
            SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSZ", Locale.ROOT).format(Date())
    }
}
