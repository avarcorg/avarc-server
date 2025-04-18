import { useTranslation } from 'next-i18next';
import { logMissingTranslation, getMissingTranslations, clearMissingTranslations } from './translationUtils';

/**
 * Custom hook that provides a safe translation function
 * @param {string[]} namespaces - Array of translation namespaces
 * @returns {Object} Object containing the safeTranslate function and other i18n utilities
 */
export const useSafeTranslation = (namespaces) => {
    const { t, i18n, ...rest } = useTranslation(namespaces);

    /**
     * Safe translation function that ensures a value is always returned
     * @param {string} key - Translation key
     * @param {string} ns - Namespace
     * @returns {string} Translated text or fallback
     */
    const safeTranslate = (key, ns) => {
        // Check if the translation exists
        const exists = i18n.exists(key, { ns });
        if (!exists) {
            logMissingTranslation(key, ns);
            return `[${ns}:${key}]`;
        }

        // Get the translation
        const translation = t(key, { ns });

        // If the translation is the same as the key, it's missing
        if (translation === key) {
            logMissingTranslation(key, ns);
            return `[${ns}:${key}]`;
        }

        return translation;
    };

    return {
        safeTranslate,
        t,
        i18n,
        getMissingTranslations,
        clearMissingTranslations,
        ...rest
    };
};
