import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import FavoriteButton from '../components/FavoriteButton'
import '../styles/user.css'

function Favorites() {
    const { t, i18n } = useTranslation()
    const navigate = useNavigate()
    const { ready, isLoggedIn, user, getFavorites, favoriteIds, logout } = useAuth()
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const isEn = !(i18n.resolvedLanguage || i18n.language || 'zh').startsWith('zh')

    useEffect(() => {
        if (!isLoggedIn) return
        let cancelled = false
        getFavorites().then(data => {
            if (!cancelled) { setItems(data); setLoading(false) }
        })
        return () => { cancelled = true }
        // 只在登录后加载一次；取消收藏时在下方按 favoriteIds 过滤
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoggedIn])

    if (ready && !isLoggedIn) return <Navigate to="/login?redirect=%2Ffavorites" replace />

    const visible = items.filter(item => favoriteIds.has(item.id))

    return (
        <main style={{ paddingTop: '120px', minHeight: '100vh' }}>
            <section className="section">
                <div className="container">
                    <h1 className="section-title">{t('user.favoritesTitle')}</h1>
                    <div className="section-subtitle">{t('user.favoritesSubtitle')}</div>

                    {user && (
                        <div className="favorites-account">
                            <span>{t('user.signedInAs', { name: user.nickname })}</span>
                            <button type="button" className="btn-text" onClick={() => { logout(); navigate('/') }}>
                                {t('user.logout')}
                            </button>
                        </div>
                    )}

                    {(!ready || loading) ? (
                        <div className="loading"><div className="loading-spinner"></div></div>
                    ) : visible.length === 0 ? (
                        <div className="favorites-empty">
                            <p>{t('user.favoritesEmpty')}</p>
                            <Link to="/gallery" className="btn btn-outline">{t('user.browseGallery')}</Link>
                        </div>
                    ) : (
                        <div className="jewelry-grid">
                            {visible.map((item, index) => (
                                <div
                                    key={item.id}
                                    className="card animate-fade-in-up"
                                    style={{ animationDelay: `${index * 50}ms`, cursor: 'pointer' }}
                                    onClick={() => navigate(`/gallery?id=${item.id}`)}
                                >
                                    <div style={{ overflow: 'hidden', position: 'relative' }}>
                                        {item.images && item.images[0] ? (
                                            <img
                                                src={item.images[0].thumb_path || item.images[0].path}
                                                alt={isEn ? (item.name_en || item.name) : item.name}
                                                className="card-image"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="card-image" style={{ background: 'linear-gradient(135deg, #E8E4DF 0%, #D4CEC6 100%)' }} />
                                        )}
                                        <FavoriteButton jewelryId={item.id} className="on-card" />
                                    </div>
                                    <div className="card-content">
                                        <h3 className="card-title">{isEn ? (item.name_en || item.name) : item.name}</h3>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </main>
    )
}

export default Favorites
