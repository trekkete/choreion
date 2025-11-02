/**
 * Internationalization Module
 * Handles loading and managing translations
 */

let currentLocale = 'en';
let translations = {};

/**
 * Load translations for a specific locale
 * @param {string} locale - The locale to load (e.g., 'en', 'it')
 */
async function loadTranslations(locale) {
    try {
        const response = await fetch(`../js/i18n/${locale}.json`);
        if (!response.ok) {
            throw new Error(`Failed to load translations for ${locale}`);
        }
        translations = await response.json();
        currentLocale = locale;
        localStorage.setItem('locale', locale);
        console.log(`Loaded translations for ${locale}`);
    } catch (error) {
        console.error('Error loading translations:', error);
        // Fallback to English if loading fails
        if (locale !== 'en') {
            console.log('Falling back to English');
            await loadTranslations('en');
        }
    }
}

/**
 * Get translation by key
 * @param {string} key - The translation key
 * @param {Object} params - Optional parameters to replace in the translation
 * @returns {string} The translated text
 */
export function t(key, params = {}) {
    let text = translations[key] || key;

    // Replace placeholders like {name}, {count}, etc.
    Object.keys(params).forEach(param => {
        text = text.replace(new RegExp(`\\{${param}\\}`, 'g'), params[param]);
    });

    return text;
}

/**
 * Get current locale
 * @returns {string} Current locale code
 */
export function getCurrentLocale() {
    return currentLocale;
}

/**
 * Change locale and reload translations
 * @param {string} locale - The new locale to set
 */
export async function setLocale(locale) {
    await loadTranslations(locale);
    updateUI();
    updateLanguageSelectors();

    // Dispatch event for components that need to update manually
    window.dispatchEvent(new CustomEvent('locale:changed', { detail: { locale } }));
}

/**
 * Update all UI elements with data-i18n attribute
 */
function updateUI() {
    // Update elements with data-i18n attribute for text content
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        const translation = t(key);

        if (element.tagName === 'INPUT' && element.type !== 'submit' && element.type !== 'button') {
            // For input fields, update placeholder
            if (element.hasAttribute('placeholder')) {
                element.placeholder = translation;
            }
        } else if (element.tagName === 'TEXTAREA') {
            element.placeholder = translation;
        } else if (element.tagName === 'OPTION') {
            element.textContent = translation;
        } else {
            // For other elements, update text content
            element.textContent = translation;
        }
    });

    // Update elements with data-i18n-placeholder attribute
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        element.placeholder = t(key);
    });

    // Update elements with data-i18n-title attribute
    document.querySelectorAll('[data-i18n-title]').forEach(element => {
        const key = element.getAttribute('data-i18n-title');
        element.title = t(key);
    });
}

/**
 * Initialize i18n system
 * Loads the saved locale or defaults to English
 */
export async function initI18n() {
    const savedLocale = localStorage.getItem('locale') || 'en';
    await loadTranslations(savedLocale);
    updateUI();

    // Set all language selectors to the current locale
    updateLanguageSelectors();
}

/**
 * Update all language selectors to the current locale
 */
function updateLanguageSelectors() {
    const selectors = [
        'languageSelector',
        'loginLanguageSelector',
        'projectLanguageSelector'
    ];

    selectors.forEach(id => {
        const selector = document.getElementById(id);
        if (selector) {
            selector.value = currentLocale;
        }
    });
}

/**
 * Get available locales
 * @returns {Array} Array of available locale objects
 */
export function getAvailableLocales() {
    return [
        { code: 'en', name: 'English' },
        { code: 'it', name: 'Italiano' }
    ];
}

export { loadTranslations };
