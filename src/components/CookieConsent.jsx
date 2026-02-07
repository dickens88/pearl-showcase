import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../utils/api'
import './CookieConsent.css'

// 生成随机访客ID
const generateVisitorId = () => {
    return 'v_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36)
}

// 获取或创建访客ID
const getVisitorId = () => {
    let visitorId = localStorage.getItem('visitorId')
    if (!visitorId) {
        visitorId = generateVisitorId()
        localStorage.setItem('visitorId', visitorId)
    }
    return visitorId
}

function CookieConsent() {
    const { t } = useTranslation()
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        // 检查用户是否已做出选择
        const consent = localStorage.getItem('cookieConsent')
        if (!consent) {
            setVisible(true)
        }
    }, [])

    const handleAccept = () => {
        localStorage.setItem('cookieConsent', 'accepted')
        setVisible(false)
        // 立即记录当前页面访问
        trackCurrentPage()
    }

    const handleReject = () => {
        localStorage.setItem('cookieConsent', 'rejected')
        setVisible(false)
    }

    const trackCurrentPage = () => {
        const visitorId = getVisitorId()
        api.trackPageView(window.location.pathname, visitorId, document.referrer)
    }

    if (!visible) return null

    return (
        <div className="cookie-consent">
            <div className="cookie-consent-content">
                <p>{t('cookie.message')}</p>
                <div className="cookie-consent-buttons">
                    <button className="btn btn-primary" onClick={handleAccept}>
                        {t('cookie.accept')}
                    </button>
                    <button className="btn btn-outline" onClick={handleReject}>
                        {t('cookie.reject')}
                    </button>
                </div>
            </div>
        </div>
    )
}

// 导出用于页面路由变化时调用的跟踪函数
export const trackPageView = (path) => {
    const consent = localStorage.getItem('cookieConsent')
    if (consent === 'accepted') {
        const visitorId = getVisitorId()
        api.trackPageView(path, visitorId, document.referrer)
    }
}

export default CookieConsent
