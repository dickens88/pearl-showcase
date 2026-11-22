import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import '../styles/user.css'

// 只允许站内相对路径作为登录后的跳转目标，避免开放重定向
const safeRedirect = (value) =>
    value && value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/admin') ? value : '/favorites'

function UserAuth({ mode = 'login' }) {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const { login, register, isLoggedIn } = useAuth()
    const redirect = safeRedirect(searchParams.get('redirect'))
    const isRegister = mode === 'register'

    const [email, setEmail] = useState('')
    const [nickname, setNickname] = useState('')
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [error, setError] = useState('')
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        if (isLoggedIn) navigate(redirect, { replace: true })
    }, [isLoggedIn, redirect, navigate])

    useEffect(() => {
        setError('')
        window.scrollTo(0, 0)
    }, [mode])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        if (isRegister) {
            if (password.length < 8) return setError(t('user.errors.weak_password'))
            if (password !== confirm) return setError(t('user.errors.mismatch'))
        }
        setSubmitting(true)
        const result = isRegister
            ? await register(email, password, nickname)
            : await login(email, password)
        setSubmitting(false)
        if (!result.ok) {
            setError(t(`user.errors.${result.code}`, { defaultValue: t('user.errors.unknown') }))
        }
    }

    const switchQuery = searchParams.get('redirect') ? `?redirect=${encodeURIComponent(searchParams.get('redirect'))}` : ''

    return (
        <main className="user-page">
            <div className="user-auth-card animate-fade-in-up">
                <h1 className="user-auth-title">{isRegister ? t('user.registerTitle') : t('user.loginTitle')}</h1>
                <div className="user-auth-subtitle">{t('user.subtitle')}</div>

                <form onSubmit={handleSubmit} noValidate={false}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="ua-email">{t('user.email')}</label>
                        <input id="ua-email" className="form-input" type="email" autoComplete="email"
                            required value={email} onChange={e => setEmail(e.target.value)} />
                    </div>

                    {isRegister && (
                        <div className="form-group">
                            <label className="form-label" htmlFor="ua-nick">
                                {t('user.nickname')} <span className="user-optional">{t('user.optional')}</span>
                            </label>
                            <input id="ua-nick" className="form-input" type="text" maxLength={50}
                                autoComplete="nickname" value={nickname} onChange={e => setNickname(e.target.value)} />
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label" htmlFor="ua-pass">{t('user.password')}</label>
                        <input id="ua-pass" className="form-input" type="password" required
                            autoComplete={isRegister ? 'new-password' : 'current-password'}
                            minLength={isRegister ? 8 : undefined}
                            value={password} onChange={e => setPassword(e.target.value)} />
                        {isRegister && <div className="user-hint">{t('user.passwordHint')}</div>}
                    </div>

                    {isRegister && (
                        <div className="form-group">
                            <label className="form-label" htmlFor="ua-confirm">{t('user.confirmPassword')}</label>
                            <input id="ua-confirm" className="form-input" type="password" required
                                autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} />
                        </div>
                    )}

                    {error && <div className="user-error" role="alert">{error}</div>}

                    <button type="submit" className="btn btn-secondary user-submit" disabled={submitting}>
                        {submitting ? t('user.submitting') : (isRegister ? t('user.register') : t('user.login'))}
                    </button>
                </form>

                {isRegister && <p className="user-privacy">{t('user.privacyNote')}</p>}

                <div className="user-switch">
                    {isRegister ? t('user.haveAccount') : t('user.noAccount')}{' '}
                    <Link to={(isRegister ? '/login' : '/register') + switchQuery}>
                        {isRegister ? t('user.login') : t('user.register')}
                    </Link>
                </div>
            </div>
        </main>
    )
}

export default UserAuth
