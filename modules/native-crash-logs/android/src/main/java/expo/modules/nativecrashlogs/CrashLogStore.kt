package expo.modules.nativecrashlogs

import android.content.Context
import java.io.File

internal object CrashLogStore {
    private const val CRASH_DIRECTORY = "crash-reports"
    private const val PENDING_CRASH_FILE = "last_crash.txt"
    private const val SHARE_DIRECTORY = "crash-logs"
    private const val SHARE_FILE = "lnreader_crash_logs.txt"

    fun createShareFile(context: Context): File {
        val directory = File(context.cacheDir, SHARE_DIRECTORY)
        check(directory.exists() || directory.mkdirs()) {
            "Failed to create crash log cache directory"
        }
        return File(directory, SHARE_FILE)
    }

    fun readPendingCrash(context: Context): String? {
        val file = pendingCrashFile(context)
        if (!file.isFile) return null
        return file.readText().takeIf { it.isNotBlank() }
    }

    fun writePendingCrash(context: Context, contents: String) {
        val file = pendingCrashFile(context)
        val directory = file.parentFile
        check(directory != null && (directory.exists() || directory.mkdirs())) {
            "Failed to create crash report directory"
        }

        val temporaryFile = File(directory, "$PENDING_CRASH_FILE.tmp")
        temporaryFile.writeText(contents)
        if (!temporaryFile.renameTo(file)) {
            file.writeText(contents)
            temporaryFile.delete()
        }
    }

    fun clearPendingCrash(context: Context) {
        val file = pendingCrashFile(context)
        check(!file.exists() || file.delete()) { "Failed to clear pending crash report" }
    }

    private fun pendingCrashFile(context: Context): File =
        File(File(context.filesDir, CRASH_DIRECTORY), PENDING_CRASH_FILE)
}
