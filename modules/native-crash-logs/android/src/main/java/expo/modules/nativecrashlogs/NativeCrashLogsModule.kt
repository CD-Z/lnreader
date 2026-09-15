package expo.modules.nativecrashlogs

import android.content.ClipData
import android.content.Context
import android.content.Intent
import android.os.Build
import android.webkit.WebView
import androidx.core.content.FileProvider
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class NativeCrashLogsModule : Module() {
    private val coroutineScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun definition() = ModuleDefinition {
        Name("NativeCrashLogs")

        OnCreate {
            appContext.reactContext?.let(CrashExceptionHandler::install)
        }

        OnDestroy {
            coroutineScope.cancel()
        }

        AsyncFunction("shareCrashLogs") { report: String, logLevel: String, promise: Promise ->
            coroutineScope.launch {
                try {
                    val context = requireNotNull(appContext.reactContext) {
                        "React context is unavailable"
                    }
                    val file = CrashLogStore.createShareFile(context)
                    file.writeText(
                        CrashLogRedactor.redact(
                            report.take(MAX_REPORT_CHARACTERS).trimEnd(),
                        ),
                    )
                    file.appendText("\n\n[App-accessible logcat]\n")
                    file.appendText(LogcatCollector.collect(context, logLevel))

                    withContext(Dispatchers.Main) {
                        shareFile(context, file)
                    }
                    promise.resolve(null)
                } catch (error: Exception) {
                    promise.reject("ECRASHLOG", "Failed to share crash logs", error)
                }
            }
        }

        Function("recordJsCrash") { stackTrace: String ->
            val context = requireNotNull(appContext.reactContext) {
                "React context is unavailable"
            }
            CrashLogStore.writePendingCrash(context, stackTrace.take(MAX_REPORT_CHARACTERS))
        }

        AsyncFunction("getPendingCrash") { promise: Promise ->
            coroutineScope.launch {
                try {
                    val context = requireNotNull(appContext.reactContext) {
                        "React context is unavailable"
                    }
                    promise.resolve(CrashLogStore.readPendingCrash(context))
                } catch (error: Exception) {
                    promise.reject("ECRASHREAD", "Failed to read pending crash", error)
                }
            }
        }

        AsyncFunction("clearPendingCrash") { promise: Promise ->
            coroutineScope.launch {
                try {
                    val context = requireNotNull(appContext.reactContext) {
                        "React context is unavailable"
                    }
                    CrashLogStore.clearPendingCrash(context)
                    promise.resolve(null)
                } catch (error: Exception) {
                    promise.reject("ECRASHCLEAR", "Failed to clear pending crash", error)
                }
            }
        }

        AsyncFunction("getDebugInfo") { promise: Promise ->
            coroutineScope.launch {
                try {
                    val context = requireNotNull(appContext.reactContext) {
                        "React context is unavailable"
                    }
                    val webViewVersion = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        WebView.getCurrentWebViewPackage()?.versionName
                    } else {
                        null
                    }
                    promise.resolve(mapOf("webViewVersion" to webViewVersion))
                } catch (error: Exception) {
                    promise.reject("EDEBUGINFO", "Failed to read native debug info", error)
                }
            }
        }

        Function("restartApp") {
            val context = requireNotNull(appContext.reactContext) {
                "React context is unavailable"
            }
            val launchIntent = requireNotNull(
                context.packageManager.getLaunchIntentForPackage(context.packageName),
            ) { "Application launch intent is unavailable" }
            try {
                CrashLogStore.clearPendingCrash(context)
            } catch (_: Exception) {
                // Restart remains useful even if stale crash cleanup fails.
            }
            launchIntent.addFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK or
                    Intent.FLAG_ACTIVITY_CLEAR_TASK or
                    Intent.FLAG_ACTIVITY_CLEAR_TOP,
            )
            val activity = appContext.currentActivity
            if (activity == null) {
                context.startActivity(launchIntent)
            } else {
                activity.runOnUiThread {
                    activity.finishAffinity()
                    activity.startActivity(launchIntent)
                }
            }
        }
    }

    private fun shareFile(context: Context, file: java.io.File) {
        val uri = FileProvider.getUriForFile(
            context,
            "${context.packageName}.crash-logs",
            file,
        )
        val shareIntent = Intent(Intent.ACTION_SEND).apply {
            type = "text/plain"
            putExtra(Intent.EXTRA_STREAM, uri)
            clipData = ClipData.newRawUri("LNReader crash logs", uri)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
        val chooser = Intent.createChooser(shareIntent, "Share crash logs")
        if (appContext.currentActivity == null) {
            chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(chooser)
        } else {
            appContext.currentActivity?.startActivity(chooser)
        }
    }

    companion object {
        private const val MAX_REPORT_CHARACTERS = 256 * 1024
    }
}
