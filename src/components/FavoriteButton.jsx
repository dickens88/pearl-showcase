import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'

// 收藏心形按钮：未登录时跳转登录页，登录后回到当前作品
function FavoriteButton({ jewelryId, className = '' }) {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const location = useLocation()
    const { isLoggedIn, isFavorite, toggleFavorite } = useAuth()
    const active = isLoggedIn && isFavorite(jewelryId)

    const handleClick = (e) => {
        e.stopPropagation()
        e.preventDefault()
        if (!isLoggedIn) {
            const back = `${location.pathname}?id=${jewelryId}`
            document.body.style.overflow = ''
            navigate(`/login?redirect=${encodeURIComponent(back)}`)
            return
        }
        toggleFavorite(jewelryId)
    }

    const label = active ? t('user.unfavorite') : t('user.favorite')

    return (
        <button
            type="button"
            className={`favorite-btn ${active ? 'active' : ''} ${className}`}
            onClick={handleClick}
            aria-pressed={active}
            aria-label={label}
            title={label}
        >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 7.9 3.6 4.5 7 4.5c2 0 3.4 1.1 5 3 1.6-1.9 3-3 5-3 3.4 0 5.6 3.4 4.3 6.8-1.8 4.6-9.3 9.2-9.3 9.2z" />
            </svg>
        </button>
    )
}

export default FavoriteButton
