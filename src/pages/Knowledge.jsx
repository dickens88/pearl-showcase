import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

function Knowledge() {
    const { t } = useTranslation()
    const [activeTab, setActiveTab] = useState('types')

    const tabs = [
        { id: 'types', label: t('knowledge.tabs.types') },
        { id: 'quality', label: t('knowledge.tabs.quality') },
        { id: 'care', label: t('knowledge.tabs.care') },
        { id: 'culture', label: t('knowledge.tabs.culture') },
    ]

    const content = {
        types: {
            title: t('knowledge.content.types.title'),
            intro: t('knowledge.content.types.intro'),
            items: [
                {
                    name: t('knowledge.content.types.items.0.name'),
                    origin: t('knowledge.content.types.items.0.origin'),
                    desc: t('knowledge.content.types.items.0.desc'),
                    features: t('knowledge.content.types.items.0.features', { returnObjects: true })
                },
                {
                    name: t('knowledge.content.types.items.1.name'),
                    origin: t('knowledge.content.types.items.1.origin'),
                    desc: t('knowledge.content.types.items.1.desc'),
                    features: t('knowledge.content.types.items.1.features', { returnObjects: true })
                },
                {
                    name: t('knowledge.content.types.items.2.name'),
                    origin: t('knowledge.content.types.items.2.origin'),
                    desc: t('knowledge.content.types.items.2.desc'),
                    features: t('knowledge.content.types.items.2.features', { returnObjects: true })
                },
                {
                    name: t('knowledge.content.types.items.3.name'),
                    origin: t('knowledge.content.types.items.3.origin'),
                    desc: t('knowledge.content.types.items.3.desc'),
                    features: t('knowledge.content.types.items.3.features', { returnObjects: true })
                }
            ]
        },
        quality: {
            title: t('knowledge.content.quality.title'),
            intro: t('knowledge.content.quality.intro'),
            items: [
                { name: t('knowledge.content.quality.items.0.name'), desc: t('knowledge.content.quality.items.0.desc') },
                { name: t('knowledge.content.quality.items.1.name'), desc: t('knowledge.content.quality.items.1.desc') },
                { name: t('knowledge.content.quality.items.2.name'), desc: t('knowledge.content.quality.items.2.desc') },
                { name: t('knowledge.content.quality.items.3.name'), desc: t('knowledge.content.quality.items.3.desc') },
                { name: t('knowledge.content.quality.items.4.name'), desc: t('knowledge.content.quality.items.4.desc') },
                { name: t('knowledge.content.quality.items.5.name'), desc: t('knowledge.content.quality.items.5.desc') }
            ]
        },
        care: {
            title: t('knowledge.content.care.title'),
            intro: t('knowledge.content.care.intro'),
            items: [
                { name: t('knowledge.content.care.items.0.name'), desc: t('knowledge.content.care.items.0.desc') },
                { name: t('knowledge.content.care.items.1.name'), desc: t('knowledge.content.care.items.1.desc') },
                { name: t('knowledge.content.care.items.2.name'), desc: t('knowledge.content.care.items.2.desc') },
                { name: t('knowledge.content.care.items.3.name'), desc: t('knowledge.content.care.items.3.desc') },
                { name: t('knowledge.content.care.items.4.name'), desc: t('knowledge.content.care.items.4.desc') },
                { name: t('knowledge.content.care.items.5.name'), desc: t('knowledge.content.care.items.5.desc') }
            ]
        },
        culture: {
            title: t('knowledge.content.culture.title'),
            intro: t('knowledge.content.culture.intro'),
            items: [
                { name: t('knowledge.content.culture.items.0.name'), desc: t('knowledge.content.culture.items.0.desc') },
                { name: t('knowledge.content.culture.items.1.name'), desc: t('knowledge.content.culture.items.1.desc') },
                { name: t('knowledge.content.culture.items.2.name'), desc: t('knowledge.content.culture.items.2.desc') },
                { name: t('knowledge.content.culture.items.3.name'), desc: t('knowledge.content.culture.items.3.desc') }
            ]
        }
    }

    const currentContent = content[activeTab]

    return (
        <main style={{ paddingTop: '120px', minHeight: '100vh' }}>
            <section className="section">
                <div className="container">
                    <h1 className="section-title animate-fade-in">{t('knowledge.main_title')}</h1>
                    <div className="section-subtitle">{t('knowledge.main_subtitle')}</div>

                    {/* 标签切换 */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: 'var(--space-2)',
                        marginBottom: 'var(--space-12)',
                        flexWrap: 'wrap'
                    }}>
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    padding: 'var(--space-3) var(--space-6)',
                                    fontSize: 'var(--text-sm)',
                                    letterSpacing: '0.1em',
                                    border: 'none',
                                    background: activeTab === tab.id ? 'var(--color-charcoal)' : 'var(--color-pearl-cream)',
                                    color: activeTab === tab.id ? 'var(--color-pearl-white)' : 'var(--color-charcoal)',
                                    cursor: 'pointer',
                                    transition: 'all var(--transition-fast)'
                                }}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* 内容区域 */}
                    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                        <h2 style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 'var(--text-3xl)',
                            textAlign: 'center',
                            marginBottom: 'var(--space-4)'
                        }}>
                            {currentContent.title}
                        </h2>
                        <p style={{
                            textAlign: 'center',
                            color: 'var(--color-graphite)',
                            marginBottom: 'var(--space-12)',
                            lineHeight: '1.8'
                        }}>
                            {currentContent.intro}
                        </p>

                        {/* 根据不同标签显示不同布局 */}
                        {activeTab === 'types' ? (
                            <div className="grid" style={{
                                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                                gap: 'var(--space-6)'
                            }}>
                                {currentContent.items.map((item, index) => (
                                    <div
                                        key={index}
                                        className="animate-fade-in-up"
                                        style={{
                                            animationDelay: `${index * 100}ms`,
                                            background: 'var(--color-pearl-cream)',
                                            padding: 'var(--space-6)'
                                        }}
                                    >
                                        <h3 style={{
                                            fontFamily: 'var(--font-display)',
                                            fontSize: 'var(--text-xl)',
                                            marginBottom: 'var(--space-2)'
                                        }}>
                                            {item.name}
                                        </h3>
                                        <p style={{
                                            fontSize: 'var(--text-sm)',
                                            color: 'var(--color-champagne)',
                                            marginBottom: 'var(--space-4)'
                                        }}>
                                            {t('knowledge.origin_label')}：{item.origin}
                                        </p>
                                        <p style={{
                                            color: 'var(--color-graphite)',
                                            lineHeight: '1.8',
                                            marginBottom: 'var(--space-4)'
                                        }}>
                                            {item.desc}
                                        </p>
                                        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                                            {item.features.map((f, i) => (
                                                <span
                                                    key={i}
                                                    style={{
                                                        padding: 'var(--space-1) var(--space-3)',
                                                        background: 'white',
                                                        fontSize: 'var(--text-xs)',
                                                        color: 'var(--color-graphite)'
                                                    }}
                                                >
                                                    {f}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                                {currentContent.items.map((item, index) => (
                                    <div
                                        key={index}
                                        className="animate-fade-in-up"
                                        style={{
                                            animationDelay: `${index * 80}ms`,
                                            background: 'var(--color-pearl-cream)',
                                            padding: 'var(--space-6)',
                                            display: 'flex',
                                            gap: 'var(--space-6)'
                                        }}
                                    >
                                        <div style={{
                                            flexShrink: 0,
                                            width: '48px',
                                            height: '48px',
                                            background: 'var(--color-champagne)',
                                            color: 'white',
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontFamily: 'var(--font-display)',
                                            fontSize: 'var(--text-lg)'
                                        }}>
                                            {index + 1}
                                        </div>
                                        <div>
                                            <h3 style={{
                                                fontFamily: 'var(--font-display)',
                                                fontSize: 'var(--text-lg)',
                                                marginBottom: 'var(--space-2)'
                                            }}>
                                                {item.name}
                                            </h3>
                                            <p style={{
                                                color: 'var(--color-graphite)',
                                                lineHeight: '1.8'
                                            }}>
                                                {item.desc}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </main>
    )
}

export default Knowledge
