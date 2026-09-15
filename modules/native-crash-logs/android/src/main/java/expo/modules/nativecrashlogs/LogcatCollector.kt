package expo.modules.nativecrashlogs

import android.content.Context
import java.io.File
import java.util.concurrent.TimeUnit

internal object LogcatCollector {
    private const val MAX_LOG_BYTES = 512 * 1024
    private const val MAX_LOG_LINES = 2_000
    private const val LOGCAT_TIMEOUT_SECONDS = 2L

    fun collect(context: Context, requestedLevel: String): String {
        val level = if (requestedLevel == "V") "V" else "E"
        val output = File.createTempFile("lnreader-logcat-", ".tmp", context.cacheDir)
        return try {
            val process = ProcessBuilder(
                "logcat",
                "-d",
                "-t",
                MAX_LOG_LINES.toString(),
                "-v",
                "year",
                "-v",
                "zone",
                "*:$level",
            )
                .redirectErrorStream(true)
                .redirectOutput(output)
                .start()

            if (!process.waitFor(LOGCAT_TIMEOUT_SECONDS, TimeUnit.SECONDS)) {
                process.destroyForcibly()
            }
            readBounded(output)
        } catch (error: Exception) {
            "Logcat unavailable: ${error.message ?: error.javaClass.simpleName}"
        } finally {
            output.delete()
        }
    }

    private fun readBounded(file: File): String {
        if (!file.isFile || file.length() == 0L) return "No accessible logcat entries."

        val wasTruncated = file.length() > MAX_LOG_BYTES
        val bytes = file.inputStream().use { input ->
            var bytesToSkip = if (wasTruncated) file.length() - MAX_LOG_BYTES else 0L
            while (bytesToSkip > 0) {
                val skipped = input.skip(bytesToSkip)
                if (skipped <= 0) break
                bytesToSkip -= skipped
            }
            val buffer = ByteArray(MAX_LOG_BYTES)
            var totalRead = 0
            while (totalRead < buffer.size) {
                val count = input.read(buffer, totalRead, buffer.size - totalRead)
                if (count == -1) break
                totalRead += count
            }
            buffer.copyOf(totalRead)
        }
        val sanitized = bytes.toString(Charsets.UTF_8)
            .lineSequence()
            .joinToString("\n", transform = CrashLogRedactor::redact)

        return if (wasTruncated) {
            "[Older logcat entries truncated]\n$sanitized"
        } else {
            sanitized
        }
    }

}
