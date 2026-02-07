import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

function About() {
    const { t } = useTranslation()
    const [content, setContent] = useState(null)

    useEffect(() => {
        loadContent()
    }, [])

    const loadContent = async () => {
        try {
            const res = await fetch('/api/pages/about')
            if (res.ok) {
                const data = await res.json()
                setContent(data)
            }
        } catch (error) {
            console.log('使用默认内容')
        }
    }

    const defaultContent = {
        title: t('about.title'),
        story: t('about.story_text'),
        philosophy: {
            title: t('about.philosophy.title'),
            items: [
                { title: t('about.philosophy.items.0.title'), desc: t('about.philosophy.items.0.desc') },
                { title: t('about.philosophy.items.1.title'), desc: t('about.philosophy.items.1.desc') },
                { title: t('about.philosophy.items.2.title'), desc: t('about.philosophy.items.2.desc') }
            ]
        }
    }

    const displayContent = content || defaultContent

    return (
        <main style={{ paddingTop: '120px', minHeight: '100vh' }}>
            {/* 品牌标题 */}
            <section className="section" style={{ paddingBottom: 'var(--space-8)' }}>
                <div className="container" style={{ maxWidth: '900px', textAlign: 'center' }}>
                    <h1 className="section-title animate-fade-in">{displayContent.title}</h1>
                    <div className="section-subtitle">{t('about.subtitle')}</div>
                </div>
            </section>

            {/* 品牌故事 */}
            <section style={{ paddingBottom: 'var(--space-24)' }}>
                <div className="container" style={{ maxWidth: '800px' }}>
                    <div
                        className="animate-fade-in-up"
                        style={{
                            background: 'var(--color-pearl-cream)',
                            padding: 'var(--space-12)',
                            position: 'relative'
                        }}
                    >
                        {/* 装饰引号 */}
                        <div style={{
                            position: 'absolute',
                            top: 'var(--space-6)',
                            left: 'var(--space-6)',
                            fontSize: 'var(--text-6xl)',
                            fontFamily: 'var(--font-display)',
                            color: 'var(--color-champagne)',
                            opacity: '0.3',
                            lineHeight: '1'
                        }}>
                            "
                        </div>

                        <div style={{
                            whiteSpace: 'pre-line',
                            lineHeight: '2.2',
                            fontSize: 'var(--text-lg)',
                            color: 'var(--color-graphite)',
                            textAlign: 'justify',
                            paddingTop: 'var(--space-6)'
                        }}>
                            {displayContent.story}
                        </div>
                    </div>
                </div>
            </section>

            {/* 设计理念 */}
            <section className="section" style={{ background: 'var(--color-mist)' }}>
                <div className="container">
                    <h2 className="section-title">{displayContent.philosophy?.title || t('about.philosophy.title')}</h2>
                    <div className="section-subtitle">{t('about.philosophy.subtitle')}</div>

                    <div className="grid" style={{
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: 'var(--space-8)',
                        maxWidth: '1000px',
                        margin: '0 auto'
                    }}>
                        {(displayContent.philosophy?.items || defaultContent.philosophy.items).map((item, index) => (
                            <div
                                key={index}
                                className="animate-fade-in-up"
                                style={{
                                    animationDelay: `${index * 150}ms`,
                                    background: 'white',
                                    padding: 'var(--space-8)',
                                    textAlign: 'center'
                                }}
                            >
                                <div style={{
                                    width: '60px',
                                    height: '60px',
                                    margin: '0 auto var(--space-6)',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, var(--color-champagne-light) 0%, var(--color-champagne) 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontSize: 'var(--text-2xl)',
                                    fontFamily: 'var(--font-display)'
                                }}>
                                    {index + 1}
                                </div>
                                <h3 style={{
                                    fontFamily: 'var(--font-display)',
                                    fontSize: 'var(--text-xl)',
                                    marginBottom: 'var(--space-4)'
                                }}>
                                    {item.title}
                                </h3>
                                <p style={{
                                    color: 'var(--color-graphite)',
                                    lineHeight: '1.8'
                                }}>
                                    {item.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 品牌历程 */}
            <section className="section">
                <div className="container" style={{ maxWidth: '800px' }}>
                    <h2 className="section-title">{t('about.history.title')}</h2>
                    <div className="section-subtitle">{t('about.history.subtitle')}</div>

                    <div style={{ position: 'relative', paddingLeft: 'var(--space-8)' }}>
                        {/* 时间线 */}
                        <div style={{
                            position: 'absolute',
                            left: '0',
                            top: '0',
                            bottom: '0',
                            width: '2px',
                            background: 'var(--color-silver)'
                        }} />

                        {[
                            { year: '2018', event: t('about.history.events.0.text') },
                            { year: '2019', event: t('about.history.events.1.text') },
                            { year: '2020', event: t('about.history.events.2.text') },
                            { year: '2022', event: t('about.history.events.3.text') },
                            { year: '2024', event: t('about.history.events.4.text') },
                        ].map((item, index) => (
                            <div
                                key={index}
                                className="animate-fade-in-up"
                                style={{
                                    animationDelay: `${index * 100}ms`,
                                    position: 'relative',
                                    marginBottom: 'var(--space-8)',
                                    paddingLeft: 'var(--space-8)'
                                }}
                            >
                                {/* 时间点 */}
                                <div style={{
                                    position: 'absolute',
                                    left: '-5px',
                                    top: '4px',
                                    width: '12px',
                                    height: '12px',
                                    borderRadius: '50%',
                                    background: 'var(--color-champagne)',
                                    border: '3px solid var(--color-pearl-white)'
                                }} />

                                <div style={{
                                    fontFamily: 'var(--font-display)',
                                    fontSize: 'var(--text-xl)',
                                    color: 'var(--color-champagne)',
                                    marginBottom: 'var(--space-2)'
                                }}>
                                    {item.year}
                                </div>
                                <p style={{ color: 'var(--color-graphite)' }}>
                                    {item.event}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </main>
    )
}

export default About
