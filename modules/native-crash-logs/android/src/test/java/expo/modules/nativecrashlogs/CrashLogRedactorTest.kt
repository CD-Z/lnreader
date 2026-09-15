package expo.modules.nativecrashlogs

import org.junit.Assert.assertEquals
import org.junit.Test

class CrashLogRedactorTest {
    @Test
    fun redactsSensitiveHeaders() {
        val report = "Authorization: Bearer secret\nCookie=session-secret\nmessage"

        assertEquals(
            "Authorization: [REDACTED]\nCookie=[REDACTED]\nmessage",
            CrashLogRedactor.redact(report),
        )
    }

    @Test
    fun redactsUrlQueries() {
        val report = "Request failed: https://example.com/chapter?id=12&token=secret"

        assertEquals(
            "Request failed: https://example.com/chapter?[REDACTED]",
            CrashLogRedactor.redact(report),
        )
    }
}
