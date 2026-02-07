import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from './LanguageSwitcher'
import '../styles/navbar.css'

function Navbar() {
    const { t } = useTranslation()
    const [scrolled, setScrolled] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)
    const location = useLocation()

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 100)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    useEffect(() => {
        setMobileOpen(false)
    }, [location])

    const navLinks = [
        { path: '/', label: t('nav.home') },
        { path: '/gallery', label: t('nav.gallery') },
        { path: '/about', label: t('nav.about') },
        { path: '/knowledge', label: t('nav.knowledge') },
        { path: '/contact', label: t('nav.contact') },
    ]

    return (
        <nav className={`zgyj-navbar ${scrolled ? 'scrolled' : ''}`}>
            <div className="navbar-container">
                <div className="navbar-left">
                    <Link to="/" className="navbar-logo">
                        Chronolume
                    </Link>
                    <div className={`navbar-links ${mobileOpen ? 'open' : ''}`}>
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`navbar-link ${location.pathname === link.path ? 'active' : ''}`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="navbar-right">
                    <LanguageSwitcher />
                    <button className="navbar-icon" aria-label={t('nav.search')}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <circle cx="11" cy="11" r="8" />
                            <path d="M21 21l-4.35-4.35" />
                        </svg>
                    </button>
                    <button
                        className={`navbar-toggle ${mobileOpen ? 'open' : ''}`}
                        onClick={() => setMobileOpen(!mobileOpen)}
                        aria-label={t('nav.menu')}
                    >
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>
                </div>
            </div>
        </nav>
    )
}

export default Navbar
