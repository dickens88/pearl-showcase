import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import '../styles/user.css'

const PersonIcon = () => (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5" />
    </svg>
)

// 导航栏右侧的小入口：未登录显示“登录”，登录后显示昵称下拉
function UserMenu() {
    const { t } = useTranslation()
    const { isLoggedIn, user, logout } = useAuth()
    const [open, setOpen] = useState(false)
    const ref = useRef(null)
    const location = useLocation()
    const navigate = useNavigate()

    useEffect(() => { setOpen(false) }, [location])

    useEffect(() => {
        if (!open) return
        const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
        const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
        document.addEventListener('mousedown', onDoc)
        document.addEventListener('keydown', onKey)
        return () => {
            document.removeEventListener('mousedown', onDoc)
            document.removeEventListener('keydown', onKey)
        }
    }, [open])

    if (!isLoggedIn) {
        return (
            <Link
                to="/login"
                className={`user-menu-toggle ${location.pathname === '/login' || location.pathname === '/register' ? 'active' : ''}`}
                aria-label={t('user.login')}
            >
                <PersonIcon />
                <span className="user-menu-label">{t('user.login')}</span>
            </Link>
        )
    }

    return (
        <div className="user-menu" ref={ref}>
            <button
                type="button"
                className={`user-menu-toggle ${open || location.pathname === '/favorites' ? 'active' : ''}`}
                onClick={() => setOpen(o => !o)}
                aria-haspopup="menu"
                aria-expanded={open}
                aria-label={user.nickname}
            >
                <PersonIcon />
                <span className="user-menu-name">{user.nickname}</span>
            </button>
            {open && (
                <div className="user-menu-dropdown" role="menu">
                    <Link to="/favorites" className="user-menu-item" role="menuitem">{t('user.myFavorites')}</Link>
                    <button
                        type="button"
                        className="user-menu-item"
                        role="menuitem"
                        onClick={() => { logout(); navigate('/') }}
                    >
                        {t('user.logout')}
                    </button>
                </div>
            )}
        </div>
    )
}

export default UserMenu
