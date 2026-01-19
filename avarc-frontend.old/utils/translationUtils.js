// Keep track of missing translations to avoid duplicate logs
const missingTranslations = new Set();

/**
 * Logs a missing translation to the console
 * @param {string} key - Translation key
 * @param {string} namespace - Translation namespace
 */
export const logMissingTranslation = (key, namespace) => {
    const translationKey = `${namespace}:${key}`;
    if (!missingTranslations.has(translationKey)) {
        missingTranslations.add(translationKey);
        console.warn(`Missing translation for key "${key}" in namespace "${namespace}"`);

        // TODO: In a future revision, consider adding server-side logging for missing translations
        // try {
        //     await fetch('/api/log-translation', {
        //         method: 'POST',
        //         headers: {
        //             'Content-Type': 'application/json',
        //         },
        //         body: JSON.stringify({ key, namespace }),
        //     });
        // } catch (error) {
        //     console.error('Failed to log missing translation to server:', error);
        // }
    }
};

/**
 * Gets a dump of all missing translations
 * @returns {Array} Array of missing translations with their details
 */
export const getMissingTranslations = () => {
    return Array.from(missingTranslations).map(key => {
        const [namespace, translationKey] = key.split(':');
        return {
            key: translationKey,
            namespace,
            timestamp: new Date().toISOString()
        };
    });
};

/**
 * Clears the missing translations cache
 */
export const clearMissingTranslations = () => {
    missingTranslations.clear();
};
