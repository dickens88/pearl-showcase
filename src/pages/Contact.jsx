import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import '../styles/index.css'

function Contact() {
    const { t } = useTranslation()
    const [pageContent, setPageContent] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadContent()
    }, [])

    const loadContent = async () => {
        try {
            const res = await fetch('/api/pages/contact')
            if (res.ok) {
                const data = await res.json()
                setPageContent(data)
            }
        } catch (error) {
            console.error('加载页面内容失败', error)
        } finally {
            setLoading(false)
        }
    }

    // 默认数据
    const defaultContent = {
        email: '-',
        wechat: 'Chronolume',
        xiaohongshu: '@Chronolume_Pearl',
        instagram: '@chronolume_pearl'
    }

    const displayedContent = { ...defaultContent, ...pageContent }

    return (
        <main style={{ paddingTop: '120px', minHeight: '100vh' }}>
            <section className="section">
                <div className="container" style={{ maxWidth: '800px' }}>
                    <h1 className="section-title animate-fade-in">{t('contact.title')}</h1>
                    <div className="section-subtitle">{t('contact.subtitle')}</div>

                    <div
                        className="animate-fade-in-up"
                        style={{
                            background: 'var(--color-pearl-cream)',
                            padding: 'var(--space-12)',
                            textAlign: 'center',
                            marginBottom: 'var(--space-8)'
                        }}
                    >
                        <p style={{
                            fontSize: 'var(--text-lg)',
                            color: 'var(--color-graphite)',
                            lineHeight: '2',
                            marginBottom: 'var(--space-8)',
                            whiteSpace: 'pre-line'
                        }}>
                            {t('contact.intro')}
                        </p>
                    </div>

                    <div className="grid" style={{
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: 'var(--space-6)'
                    }}>
                        {/* 邮箱 */}
                        <div
                            className="animate-fade-in-up delay-100"
                            style={{
                                background: 'white',
                                padding: 'var(--space-8)',
                                textAlign: 'center',
                                boxShadow: 'var(--shadow-sm)'
                            }}
                        >
                            <div style={{
                                fontSize: 'var(--text-4xl)',
                                marginBottom: 'var(--space-4)',
                                color: 'var(--color-champagne)'
                            }}>
                                ✉
                            </div>
                            <h3 style={{
                                fontFamily: 'var(--font-display)',
                                fontSize: 'var(--text-lg)',
                                marginBottom: 'var(--space-3)'
                            }}>
                                {t('contact.email')}
                            </h3>
                            <p style={{ color: 'var(--color-graphite)' }}>
                                {displayedContent.email}
                            </p>
                        </div>

                        {/* 社交媒体 */}
                        <div
                            className="animate-fade-in-up delay-200"
                            style={{
                                background: 'white',
                                padding: 'var(--space-8)',
                                textAlign: 'center',
                                boxShadow: 'var(--shadow-sm)'
                            }}
                        >
                            <div style={{
                                fontSize: 'var(--text-4xl)',
                                marginBottom: 'var(--space-4)',
                                color: 'var(--color-champagne)'
                            }}>
                                📱
                            </div>
                            <h3 style={{
                                fontFamily: 'var(--font-display)',
                                fontSize: 'var(--text-lg)',
                                marginBottom: 'var(--space-3)'
                            }}>
                                {t('contact.social')}
                            </h3>
                            <p style={{ color: 'var(--color-graphite)', lineHeight: '1.8' }}>
                                微信号：{displayedContent.wechat}<br />
                                小红书：{displayedContent.xiaohongshu}<br />
                                Instagram：{displayedContent.instagram}
                            </p>
                        </div>

                        {/* 工作时间 */}
                        <div
                            className="animate-fade-in-up delay-300"
                            style={{
                                background: 'white',
                                padding: 'var(--space-8)',
                                textAlign: 'center',
                                boxShadow: 'var(--shadow-sm)'
                            }}
                        >
                            <div style={{
                                fontSize: 'var(--text-4xl)',
                                marginBottom: 'var(--space-4)',
                                color: 'var(--color-champagne)'
                            }}>
                                🕐
                            </div>
                            <h3 style={{
                                fontFamily: 'var(--font-display)',
                                fontSize: 'var(--text-lg)',
                                marginBottom: 'var(--space-3)'
                            }}>
                                {t('contact.response_time')}
                            </h3>
                            <p style={{ color: 'var(--color-graphite)', lineHeight: '1.8' }}>
                                {t('contact.days')}<br />
                                {t('contact.hours')}
                            </p>
                        </div>
                    </div>

                    {/* 底部说明 */}
                    <div
                        className="animate-fade-in-up delay-400"
                        style={{
                            marginTop: 'var(--space-12)',
                            padding: 'var(--space-8)',
                            background: 'var(--color-mist)',
                            textAlign: 'center'
                        }}
                    >
                        <p style={{
                            fontSize: 'var(--text-sm)',
                            color: 'var(--color-graphite)',
                            lineHeight: '1.8',
                            whiteSpace: 'pre-line'
                        }}>
                            {t('contact.footer_note')}
                        </p>
                    </div>
                </div>
            </section>
        </main>
    )
}

export default Contact
