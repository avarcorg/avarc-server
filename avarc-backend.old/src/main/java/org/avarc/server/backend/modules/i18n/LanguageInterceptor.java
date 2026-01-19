package org.avarc.server.backend.modules.i18n;

import java.util.Enumeration;
import java.util.Locale;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.LocaleResolver;

@Slf4j
@Component
public class LanguageInterceptor implements HandlerInterceptor {
    private final LocaleResolver localeResolver;
    private static final String LANGUAGE_HEADER = "X-Language";

    public LanguageInterceptor(LocaleResolver localeResolver) {
        this.localeResolver = localeResolver;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        log.debug("→ Entering preHandle()");

        if (log.isTraceEnabled()) {
            // Log all headers
            Enumeration<String> headerNames = request.getHeaderNames();
            while (headerNames.hasMoreElements()) {
                String headerName = headerNames.nextElement();
                String headerValue = request.getHeader(headerName);
                log.trace("  Header: {} = {}", headerName, headerValue);
            }
        }

        // Check X-Language header (case-insensitive)
        String language = null;
        Enumeration<String> xLanguageHeaders = request.getHeaders(LANGUAGE_HEADER);
        if (xLanguageHeaders.hasMoreElements()) {
            language = xLanguageHeaders.nextElement();
        }
        log.debug("  {} header: {}", LANGUAGE_HEADER, language);

        if (language != null && !language.isEmpty()) {
            Locale locale = Locale.forLanguageTag(language);
            log.debug("  Setting locale to: {}", locale);
            localeResolver.setLocale(request, response, locale);
        } else {
            // Fallback to Accept-Language header
            String acceptLanguage = request.getHeader(HttpHeaders.ACCEPT_LANGUAGE);
            if (acceptLanguage != null && !acceptLanguage.isEmpty()) {
                log.debug("  Accept-Language header: {}", acceptLanguage);
                // Parse Accept-Language header and get the first language without quality factor
                String[] languages = acceptLanguage.split(",");
                if (languages.length > 0) {
                    // Get the first language, removing any quality factor
                    String primaryLanguage = languages[0].split(";")[0].trim();
                    Locale locale = Locale.forLanguageTag(primaryLanguage);
                    log.debug("  Setting locale from Accept-Language to: {}", locale);
                    localeResolver.setLocale(request, response, locale);
                }
            }
        }

        return true;
    }
}
