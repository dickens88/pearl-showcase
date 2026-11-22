import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
    { code: 'zh', short: '中', label: '中文' },
    { code: 'en', short: 'EN', label: 'English' },
    { code: 'hu', short: 'HU', label: 'Magyar' },
];

const LanguageSwitcher = () => {
    const { i18n } = useTranslation();
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    // Normalize zh-CN / en-US / hu-HU etc. to the base code
    const currentCode = (i18n.resolvedLanguage || i18n.language || 'zh').split('-')[0];
    const current = LANGUAGES.find((l) => l.code === currentCode) || LANGUAGES[0];

    useEffect(() => {
        if (!open) return;
        const handleClickOutside = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        const handleKey = (e) => {
            if (e.key === 'Escape') setOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKey);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKey);
        };
    }, [open]);

    const selectLanguage = (code) => {
        i18n.changeLanguage(code);
        setOpen(false);
    };

    return (
        <div className="language-switcher" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="navbar-icon language-switcher-toggle"
                aria-label="Switch Language"
                aria-haspopup="listbox"
                aria-expanded={open}
            >
                {current.short}
                <span className={`language-switcher-caret ${open ? 'open' : ''}`} aria-hidden="true">▾</span>
            </button>
            {open && (
                <ul className="language-switcher-menu" role="listbox">
                    {LANGUAGES.map((lang) => (
                        <li key={lang.code}>
                            <button
                                type="button"
                                role="option"
                                aria-selected={lang.code === current.code}
                                lang={lang.code}
                                className={`language-switcher-option ${lang.code === current.code ? 'active' : ''}`}
                                onClick={() => selectLanguage(lang.code)}
                            >
                                {lang.label}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default LanguageSwitcher;
