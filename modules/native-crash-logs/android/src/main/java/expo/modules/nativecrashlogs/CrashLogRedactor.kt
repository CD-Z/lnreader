package expo.modules.nativecrashlogs

internal object CrashLogRedactor {
    private val headerPattern = Regex(
        pattern = "(?i)(authorization|cookie|set-cookie)(\\s*[:=]\\s*).*$",
        options = setOf(RegexOption.MULTILINE),
    )
    private val urlQueryPattern = Regex(
        pattern = "(?i)(https?://[^\\s?#]+)\\?[^\\s#\"')\\]]+",
    )

    fun redact(contents: String): String = contents
        .replace(headerPattern, "$1$2[REDACTED]")
        .replace(urlQueryPattern, "$1?[REDACTED]")
}
