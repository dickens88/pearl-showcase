import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../utils/api'
import '../styles/footer.css'

function Footer() {
    const { t } = useTranslation()
    const [contactInfo, setContactInfo] = useState({
        email: '-'
    })

    useEffect(() => {
        loadContactInfo()
    }, [])

    const loadContactInfo = async () => {
        try {
            const data = await api.getPageContent('contact')
            if (data) {
                // API直接返回已解析的JSON对象
                setContactInfo(prev => ({
                    ...prev,
                    email: data.email || prev.email,
                    address: data.address,
                    phone: data.phone
                }))
            }
        } catch (error) {
            console.error('Failed to load footer contact info')
        }
    }

    return (
        <footer className="zgyj-footer">
            <div className="footer-container">
                <div className="footer-grid">
                    <div className="footer-brand">
                        <Link to="/" className="footer-logo">Chronolume</Link>
                        <p className="footer-tagline">
                            {t('footer.tagline')}
                        </p>
                    </div>

                    <div className="footer-links-group">
                        <h5 className="footer-heading">{t('footer.quickLinks')}</h5>
                        <ul className="footer-links">
                            <li><Link to="/">{t('nav.home')}</Link></li>
                            <li><Link to="/gallery">{t('nav.gallery')}</Link></li>
                            <li><Link to="/about">{t('nav.about')}</Link></li>
                            <li><Link to="/knowledge">{t('nav.knowledge')}</Link></li>
                        </ul>
                    </div>

                    <div className="footer-contact">
                        <h5 className="footer-heading">{t('footer.contactInfo')}</h5>
                        <div className="footer-contact-info">
                            <p>{contactInfo.address || t('footer.address')}</p>
                            <p>{contactInfo.email}</p>
                            <p>{contactInfo.phone || '+86 021 8888 9999'}</p>
                        </div>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p className="footer-copyright">
                        {t('footer.copyright')}
                    </p>
                    <div className="footer-socials">
                        <a href="#" className="footer-social" aria-label="Instagram">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <rect x="2" y="2" width="20" height="20" rx="5" />
                                <circle cx="12" cy="12" r="4" />
                                <circle cx="18" cy="6" r="1" fill="currentColor" />
                            </svg>
                        </a>
                        <a href="#" className="footer-social" aria-label="微信">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M8.5 11a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM13.5 11a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" fill="currentColor" />
                                <path d="M9 17c-4.5 0-7-2.5-7-5.5S4.5 6 9 6c4.5 0 7 2.5 7 5.5 0 1.5-.5 2.8-1.5 3.8L15 18l-3-1.5c-.8.3-1.8.5-3 .5Z" />
                                <path d="M15.5 13.5c3 0 5.5 2 5.5 4.5 0 1-.5 2-1 2.5l.5 2-2-1c-.5.2-1.2.5-2 .5-3 0-5.5-2-5.5-4.5" />
                            </svg>
                        </a>
                        <a href="#" className="footer-social" aria-label="Pinterest">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M9.5 21c.5-2 1.5-5 2-7 .5 1 1.5 2 3 2 2.5 0 4.5-2.5 4.5-5.5C19 7 16 4.5 12 4.5 7.5 4.5 5 7.5 5 11c0 1.5.5 2.5 1.5 3.5-1 .5-1 1.5-.5 2" />
                            </svg>
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default Footer
