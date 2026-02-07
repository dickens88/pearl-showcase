import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
    const { i18n } = useTranslation();

    const currentLang = i18n.language;

    // Helper to check if lang is Chinese (handling zh-CN, zh-TW, etc.)
    const isZh = currentLang && currentLang.startsWith('zh');

    const toggleLanguage = () => {
        i18n.changeLanguage(isZh ? 'en' : 'zh');
    };

    return (
        <button
            onClick={toggleLanguage}
            className="navbar-icon language-switcher" // Reusing navbar-icon class for basic styling if available, adding custom class
            style={{
                fontSize: '14px',
                fontWeight: '500',
                width: 'auto',
                padding: '0 8px',
                fontFamily: 'var(--font-display, serif)'
            }}
            aria-label="Switch Language"
        >
            {isZh ? 'EN' : '中'}
        </button>
    );
};

export default LanguageSwitcher;
