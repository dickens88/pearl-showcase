import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import '../styles/home.css'

function Home() {
    const { t, i18n } = useTranslation()
    const isEn = i18n.language === 'en'
    const [pageContent, setPageContent] = useState(null)
    const [featuredJewelry, setFeaturedJewelry] = useState([])
    const [galleryImages, setGalleryImages] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadContent()
    }, [i18n.language])

    const loadContent = async () => {
        try {
            const contentRes = await fetch('/api/pages/home')
            if (contentRes.ok) {
                const content = await contentRes.json()
                setPageContent(content)
            }

            const jewelryRes = await fetch('/api/jewelry?featured=true&limit=3')
            if (jewelryRes.ok) {
                const jewelry = await jewelryRes.json()
                setFeaturedJewelry(jewelry)
            }

            // 加载展廊图片
            const galleryRes = await fetch('/api/gallery')
            if (galleryRes.ok) {
                const gallery = await galleryRes.json()
                setGalleryImages(gallery)
            }
        } catch (error) {
            console.log('使用默认内容')
        } finally {
            setLoading(false)
        }
    }

    // 默认展示数据
    const defaultJewelry = [
        { id: 1, name: '月影系列 · 耳环', name_en: 'Moonshadow Series · Earrings', description: 'Akoya珍珠 | 18K足金', description_en: 'Akoya Pearl | 18K Gold', image: '/images/jewelry1.jpg' },
        { id: 2, name: '晨露系列 · 颈饰', name_en: 'Morning Dew Series · Necklace', description: '大溪地黑珍珠 | 铂金', description_en: 'Tahitian Black Pearl | Platinum', image: '/images/jewelry2.jpg' },
        { id: 3, name: '流萤系列 · 戒指', name_en: 'Firefly Series · Ring', description: '南洋白珠 | 细钻', description_en: 'South Sea Pearl | Diamonds', image: '/images/jewelry3.jpg' },
    ]

    // 默认展廊图片（当后端无数据时使用）
    const defaultGalleryImages = [
        { id: 1, alt: '金色南洋珍珠细节', title: '金色南洋珍珠细节' },
        { id: 2, alt: '珍珠设计工坊', title: '珍珠设计工坊' },
        { id: 3, alt: '珍珠人像艺术', title: '珍珠人像艺术' },
        { id: 4, alt: '抽象海浪', title: '抽象海浪' },
    ]

    const displayGalleryImages = galleryImages.length > 0 ? galleryImages : defaultGalleryImages

    // 珍珠知识
    const pearlKnowledge = [
        {
            num: '01',
            title: t('home.knowledge_section.items.01.title'),
            desc: t('home.knowledge_section.items.01.desc')
        },
        {
            num: '02',
            title: t('home.knowledge_section.items.02.title'),
            desc: t('home.knowledge_section.items.02.desc')
        },
        {
            num: '03',
            title: t('home.knowledge_section.items.03.title'),
            desc: t('home.knowledge_section.items.03.desc')
        },
    ]

    const displayJewelry = featuredJewelry.length > 0 ? featuredJewelry : defaultJewelry

    return (
        <main className="zgyj-home">
            {/* Hero Banner */}
            <section className="hero-section" id="home">
                <div className="hero-bg">
                    <div className="hero-gradient"></div>
                </div>
                <div className="hero-content">
                    <h2 className="hero-year">{t('home.hero.year')}</h2>
                    <h1 className="hero-title">
                        {t('home.hero.title_p1')}<br />
                        <span className="hero-highlight">{t('home.hero.title_highlight')}</span>
                    </h1>
                    <p className="hero-desc">
                        {t('home.hero.desc')}
                    </p>
                    <div className="hero-scroll">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M12 5v14M5 12l7 7 7-7" />
                        </svg>
                    </div>
                </div>
            </section>

            {/* 精选展示 - The Curated Series */}
            <section className="curated-section">
                <div className="curated-header">
                    <div className="curated-info">
                        <h3 className="curated-title">{t('home.curated.title')}</h3>
                        <p className="curated-desc">
                            {t('home.curated.desc')}
                        </p>
                    </div>
                    <Link to="/gallery" className="curated-link">
                        {t('home.curated.link')}
                    </Link>
                </div>

                <div className="curated-grid">
                    {displayJewelry.map((item, index) => (
                        <div
                            key={item.id}
                            className={`curated-item ${index === 1 ? 'offset' : ''}`}
                        >
                            <div className="curated-image-wrap">
                                {item.images && item.images[0] ? (
                                    <img
                                        src={item.images[0].path}
                                        alt={isEn ? (item.name_en || item.name) : item.name}
                                        className="curated-image"
                                        loading="lazy"
                                    />
                                ) : (
                                    <div
                                        className="curated-image curated-placeholder"
                                        style={{
                                            background: `linear-gradient(135deg, 
                                                hsl(${35 + index * 8}, 15%, ${90 - index * 3}%) 0%, 
                                                hsl(${40 + index * 8}, 20%, ${85 - index * 3}%) 100%
                                            )`
                                        }}
                                    />
                                )}
                            </div>
                            <h4 className="curated-item-title">{isEn ? (item.name_en || item.name) : item.name}</h4>
                            <p className="curated-item-desc">{isEn ? (item.description_en || item.description) : item.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* 艺术展廊 - Art Gallery */}
            <section className="gallery-section" id="gallery">
                <div className="gallery-container">
                    <div className="gallery-header">
                        <h2 className="gallery-title">{t('home.gallery.title')}</h2>
                        <div className="gallery-divider"></div>
                    </div>

                    <div className="gallery-grid">
                        {displayGalleryImages.map((img, index) => (
                            <div key={img.id} className="gallery-item">
                                {img.path ? (
                                    <img
                                        src={img.path}
                                        alt={isEn ? (img.title_en || img.alt) : (img.title || img.alt)}
                                        className="gallery-image"
                                        style={{ objectFit: 'cover' }}
                                    />
                                ) : (
                                    <div
                                        className="gallery-image"
                                        style={{
                                            background: `linear-gradient(135deg, 
                                                hsl(${30 + index * 10}, 20%, ${88 - index * 2}%) 0%, 
                                                hsl(${35 + index * 10}, 25%, ${82 - index * 2}%) 100%
                                            )`
                                        }}
                                    />
                                )}
                                <div className="gallery-overlay">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M12 5v14M5 12h14" />
                                    </svg>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 品牌介绍 - About */}
            <section className="about-section" id="about">
                <div className="about-container">
                    <div className="about-content">
                        <div className="about-text">
                            <h2 className="about-label">{t('home.about.label')}</h2>
                            <h3 className="about-headline">{t('home.about.headline')}</h3>
                            <div className="about-body">
                                <p>
                                    {t('home.about.p1')}
                                </p>
                                <p>
                                    {t('home.about.p2')}
                                </p>
                            </div>

                        </div>
                        <div className="about-image-wrap">
                            <div className="about-image-frame"></div>
                            {pageContent?.philosophy_image ? (
                                <img
                                    src={pageContent.philosophy_image}
                                    alt="Our Philosophy"
                                    className="about-image"
                                    style={{ objectFit: 'cover' }}
                                />
                            ) : (
                                <div
                                    className="about-image"
                                    style={{
                                        background: 'linear-gradient(135deg, #E8E2DE 0%, #D4CEC6 100%)'
                                    }}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* 珍珠知识 - Pearl Knowledge */}
            <section className="knowledge-section" id="knowledge">
                <div className="knowledge-container">
                    <div className="knowledge-content">
                        <div className="knowledge-left">
                            <h2 className="knowledge-title">{t('home.knowledge_section.title')}</h2>
                            <p className="knowledge-intro">
                                {t('home.knowledge_section.intro')}
                            </p>
                            <ul className="knowledge-list">
                                {pearlKnowledge.map((item) => (
                                    <li key={item.num} className="knowledge-item">
                                        <span className="knowledge-num">{item.num}. {item.title}</span>
                                        <p className="knowledge-desc">{item.desc}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="knowledge-right">
                            {pageContent?.pearl_story_image ? (
                                <img
                                    src={pageContent.pearl_story_image}
                                    alt="Pearl Story"
                                    className="knowledge-image"
                                    style={{ objectFit: 'cover' }}
                                />
                            ) : (
                                <div
                                    className="knowledge-image"
                                    style={{
                                        background: 'linear-gradient(135deg, #3A3A3A 0%, #4A4A4A 100%)'
                                    }}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </main>
    )
}

export default Home
