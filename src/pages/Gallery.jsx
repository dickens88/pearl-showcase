import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import '../styles/pagination.css'

function Gallery() {
    const { t, i18n } = useTranslation()
    const [searchParams] = useSearchParams()
    const [jewelry, setJewelry] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedCategory, setSelectedCategory] = useState('all')
    const [selectedItem, setSelectedItem] = useState(null)
    const [currentImageIndex, setCurrentImageIndex] = useState(0)

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1)
    const ITEMS_PER_PAGE = 30 // 6 columns * 5 rows

    useEffect(() => {
        loadJewelry()
    }, [])

    // Reset to first page when category changes
    useEffect(() => {
        setCurrentPage(1)
    }, [selectedCategory])

    useEffect(() => {
        // 如果URL中有id参数，打开对应饰品详情
        const id = searchParams.get('id')
        if (id && jewelry.length > 0) {
            const item = jewelry.find(j => j.id === parseInt(id))
            if (item) setSelectedItem(item)
        }
    }, [searchParams, jewelry])

    const loadJewelry = async () => {
        try {
            const res = await fetch('/api/jewelry')
            if (res.ok) {
                const data = await res.json()
                setJewelry(data)
            } else {
                setJewelry(getDefaultJewelry())
            }
        } catch (error) {
            setJewelry(getDefaultJewelry())
        } finally {
            setLoading(false)
        }
    }

    const isEn = i18n.language === 'en'

    const getDefaultJewelry = () => [
        { id: 1, name: t('gallery.items.1.name'), name_en: t('gallery.items.1.name'), category: 'earrings', description: t('gallery.items.1.desc'), description_en: t('gallery.items.1.desc'), images: [] },
        { id: 2, name: t('gallery.items.2.name'), name_en: t('gallery.items.2.name'), category: 'necklaces', description: t('gallery.items.2.desc'), description_en: t('gallery.items.2.desc'), images: [] },
        { id: 3, name: t('gallery.items.3.name'), name_en: t('gallery.items.3.name'), category: 'rings', description: t('gallery.items.3.desc'), description_en: t('gallery.items.3.desc'), images: [] },
        { id: 4, name: t('gallery.items.4.name'), name_en: t('gallery.items.4.name'), category: 'bracelets', description: t('gallery.items.4.desc'), description_en: t('gallery.items.4.desc'), images: [] },
        { id: 5, name: t('gallery.items.5.name'), name_en: t('gallery.items.5.name'), category: 'earrings', description: t('gallery.items.5.desc'), description_en: t('gallery.items.5.desc'), images: [] },
        { id: 6, name: t('gallery.items.6.name'), name_en: t('gallery.items.6.name'), category: 'brooches', description: t('gallery.items.6.desc'), description_en: t('gallery.items.6.desc'), images: [] },
        { id: 7, name: t('gallery.items.7.name'), name_en: t('gallery.items.7.name'), category: 'necklaces', description: t('gallery.items.7.desc'), description_en: t('gallery.items.7.desc'), images: [] },
        { id: 8, name: t('gallery.items.8.name'), name_en: t('gallery.items.8.name'), category: 'sets', description: t('gallery.items.8.desc'), description_en: t('gallery.items.8.desc'), images: [] },
    ]

    const openDetail = (item) => {
        setSelectedItem(item)
        setCurrentImageIndex(0)
        document.body.style.overflow = 'hidden'
    }

    const closeDetail = () => {
        setSelectedItem(null)
        document.body.style.overflow = ''
    }

    const nextImage = () => {
        if (selectedItem && selectedItem.images.length > 1) {
            setCurrentImageIndex((prev) =>
                prev === selectedItem.images.length - 1 ? 0 : prev + 1
            )
        }
    }

    const prevImage = () => {
        if (selectedItem && selectedItem.images.length > 1) {
            setCurrentImageIndex((prev) =>
                prev === 0 ? selectedItem.images.length - 1 : prev - 1
            )
        }
    }

    // 计算分页数据
    const filteredItems = jewelry.filter(item => selectedCategory === 'all' || item.category === selectedCategory)
    const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE)
    const paginatedItems = filteredItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage)
            window.scrollTo({ top: 0, behavior: 'smooth' })
        }
    }

    if (loading) {
        return (
            <main style={{ paddingTop: '120px', minHeight: '100vh' }}>
                <div className="loading">
                    <div className="loading-spinner"></div>
                </div>
            </main>
        )
    }

    return (
        <main style={{ paddingTop: '120px', minHeight: '100vh' }}>
            <section className="section">
                <div className="container">
                    <h1 className="section-title">{t('gallery.title')}</h1>
                    <div className="section-subtitle">{t('gallery.subtitle')}</div>


                    {/* 分类标签 */}
                    <div className="category-tabs" style={{
                        display: 'flex',
                        gap: 'var(--space-8)',
                        justifyContent: 'center',
                        marginBottom: 'var(--space-12)',
                        marginTop: 'var(--space-8)'
                    }}>
                        {['all', 'earrings', 'rings', 'necklaces', 'bracelets', 'brooches', 'sets', 'baroque', 'designer'].map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    padding: 'var(--space-2) 0',
                                    fontSize: 'var(--text-base)',
                                    color: selectedCategory === cat ? 'var(--color-charcoal)' : 'var(--color-gray-500)',
                                    fontFamily: 'var(--font-serif)',
                                    cursor: 'pointer',
                                    position: 'relative',
                                    transition: 'color var(--transition-base)'
                                }}
                            >
                                {t(`gallery.categories.${cat}`)}
                                {selectedCategory === cat && (
                                    <span style={{
                                        position: 'absolute',
                                        bottom: '-4px',
                                        left: '0',
                                        width: '100%',
                                        height: '1px',
                                        background: 'var(--color-champagne)'
                                    }} />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* 展示区域 */}
                    <div className="jewelry-grid">
                        {paginatedItems.map((item, index) => (
                            <div
                                key={item.id}
                                className="card animate-fade-in-up"
                                style={{ animationDelay: `${index * 50}ms`, cursor: 'pointer' }}
                                onClick={() => openDetail(item)}
                            >
                                <div style={{ overflow: 'hidden' }}>
                                    {item.images && item.images[0] ? (
                                        <img
                                            src={item.images[0].path}
                                            alt={isEn ? (item.name_en || item.name) : item.name}
                                            className="card-image"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div
                                            className="card-image"
                                            style={{
                                                background: `linear-gradient(135deg, 
                            hsl(${35 + index * 8}, 18%, ${88 - index * 2}%) 0%, 
                            hsl(${40 + index * 8}, 22%, ${82 - index * 2}%) 100%
                          )`
                                            }}
                                        />
                                    )}
                                </div>
                                <div className="card-content">
                                    <h3 className="card-title">{isEn ? (item.name_en || item.name) : item.name}</h3>
                                    <p className="card-desc" style={{
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden'
                                    }}>
                                        {isEn ? (item.description_en || item.description) : item.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* 分页与空状态 */}
                    {filteredItems.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--color-gray-500)' }}>
                            {t('common.noData') || 'No items found'}
                        </div>
                    ) : totalPages > 1 && (
                        <div className="pagination">
                            <button
                                className="pagination-btn"
                                disabled={currentPage === 1}
                                onClick={() => handlePageChange(currentPage - 1)}
                            >
                                &lt;
                            </button>
                            <span className="pagination-info">
                                {currentPage} / {totalPages}
                            </span>
                            <button
                                className="pagination-btn"
                                disabled={currentPage === totalPages}
                                onClick={() => handlePageChange(currentPage + 1)}
                            >
                                &gt;
                            </button>
                        </div>
                    )}
                </div>
            </section>

            {/* 详情弹窗 */}
            <div
                className={`modal-overlay ${selectedItem ? 'active' : ''}`}
                onClick={closeDetail}
            >
                {selectedItem && (
                    <div
                        className="modal-content"
                        onClick={(e) => e.stopPropagation()}
                        style={{ display: 'flex', maxWidth: '1000px' }}
                    >
                        {/* 图片区域 */}
                        <div style={{
                            flex: '1',
                            background: 'var(--color-mist)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minHeight: '400px',
                            position: 'relative'
                        }}>
                            {selectedItem.images && selectedItem.images.length > 0 ? (
                                <>
                                    <img
                                        src={selectedItem.images[currentImageIndex]?.path}
                                        alt={isEn ? (selectedItem.name_en || selectedItem.name) : selectedItem.name}
                                        style={{ maxWidth: '100%', maxHeight: '500px', objectFit: 'contain' }}
                                    />
                                    {selectedItem.images.length > 1 && (
                                        <>
                                            <button
                                                onClick={prevImage}
                                                style={{
                                                    position: 'absolute',
                                                    left: 'var(--space-4)',
                                                    top: '50%',
                                                    transform: 'translateY(-50%)',
                                                    background: 'rgba(255,255,255,0.8)',
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '50%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                            >
                                                ‹
                                            </button>
                                            <button
                                                onClick={nextImage}
                                                style={{
                                                    position: 'absolute',
                                                    right: 'var(--space-4)',
                                                    top: '50%',
                                                    transform: 'translateY(-50%)',
                                                    background: 'rgba(255,255,255,0.8)',
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '50%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                            >
                                                ›
                                            </button>
                                        </>
                                    )}
                                </>
                            ) : (
                                <div style={{
                                    width: '100%',
                                    height: '400px',
                                    background: 'linear-gradient(135deg, #E8E4DF 0%, #D4CEC6 100%)'
                                }} />
                            )}
                        </div>

                        {/* 信息区域 */}
                        <div style={{
                            flex: '0 0 350px',
                            padding: 'var(--space-10)',
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            <button
                                onClick={closeDetail}
                                style={{
                                    position: 'absolute',
                                    top: 'var(--space-4)',
                                    right: 'var(--space-4)',
                                    fontSize: 'var(--text-2xl)',
                                    color: 'var(--color-graphite)'
                                }}
                            >
                                ×
                            </button>

                            <h2 style={{
                                fontFamily: 'var(--font-display)',
                                fontSize: 'var(--text-3xl)',
                                marginBottom: 'var(--space-6)'
                            }}>
                                {isEn ? (selectedItem.name_en || selectedItem.name) : selectedItem.name}
                            </h2>

                            <p style={{
                                lineHeight: '2',
                                color: 'var(--color-graphite)',
                                flex: '1',
                                whiteSpace: 'pre-wrap',
                                fontFamily: "'Microsoft YaHei', '微软雅黑', sans-serif"
                            }}>
                                {(() => {
                                    const currentImage = selectedItem.images[currentImageIndex];
                                    if (isEn) {
                                        return currentImage?.description_en || selectedItem.description_en || selectedItem.description;
                                    } else {
                                        return currentImage?.description || selectedItem.description;
                                    }
                                })()}
                            </p>

                            {/* 缩略图 */}
                            {selectedItem.images && selectedItem.images.length > 1 && (
                                <div style={{
                                    display: 'flex',
                                    gap: 'var(--space-2)',
                                    marginTop: 'var(--space-6)'
                                }}>
                                    {selectedItem.images.map((img, idx) => (
                                        <div
                                            key={img.id}
                                            onClick={() => setCurrentImageIndex(idx)}
                                            style={{
                                                width: '60px',
                                                height: '60px',
                                                border: currentImageIndex === idx
                                                    ? '2px solid var(--color-champagne)'
                                                    : '2px solid transparent',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <img
                                                src={img.path}
                                                alt=""
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </main>
    )
}

export default Gallery
