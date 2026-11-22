import { createContext, useCallback, useContext, useEffect, useState } from 'react'

// 前台用户登录状态与收藏夹（与后台管理员的 adminToken 完全独立）
const TOKEN_KEY = 'userToken'
const API = '/api/user'

const AuthContext = createContext(null)

const readToken = () => {
    try { return localStorage.getItem(TOKEN_KEY) } catch { return null }
}
const writeToken = (token) => {
    try {
        if (token) localStorage.setItem(TOKEN_KEY, token)
        else localStorage.removeItem(TOKEN_KEY)
    } catch { /* 隐私模式等情况下忽略 */ }
}

export function AuthProvider({ children }) {
    const [token, setToken] = useState(readToken)
    const [user, setUser] = useState(null)
    const [favoriteIds, setFavoriteIds] = useState(() => new Set())
    const [ready, setReady] = useState(false)

    const logout = useCallback(() => {
        writeToken(null)
        setToken(null)
        setUser(null)
        setFavoriteIds(new Set())
    }, [])

    // 带用户 Token 的请求；401 时自动退出登录（不会跳转到后台登录页）
    const authFetch = useCallback(async (path, options = {}) => {
        const res = await fetch(`${API}${path}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                ...options.headers
            }
        })
        if (res.status === 401) logout()
        return res
    }, [token, logout])

    // 启动或 Token 变化时加载用户信息与收藏 ID
    useEffect(() => {
        let cancelled = false
        if (!token) { setReady(true); return }
        ;(async () => {
            try {
                const [meRes, idsRes] = await Promise.all([authFetch('/me'), authFetch('/favorites/ids')])
                if (cancelled) return
                if (meRes.ok) setUser(await meRes.json())
                if (idsRes.ok) setFavoriteIds(new Set(await idsRes.json()))
            } catch { /* 网络错误时保持未登录展示 */ }
            finally { if (!cancelled) setReady(true) }
        })()
        return () => { cancelled = true }
    }, [token, authFetch])

    const handleAuthResponse = async (res) => {
        const data = await res.json().catch(() => ({}))
        if (!res.ok) return { ok: false, code: data.code || 'unknown' }
        writeToken(data.token)
        setUser(data.user)
        setToken(data.token)
        return { ok: true }
    }

    const login = async (email, password) => {
        try {
            const res = await fetch(`${API}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            })
            return handleAuthResponse(res)
        } catch {
            return { ok: false, code: 'network' }
        }
    }

    const register = async (email, password, nickname) => {
        try {
            const res = await fetch(`${API}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, nickname })
            })
            return handleAuthResponse(res)
        } catch {
            return { ok: false, code: 'network' }
        }
    }

    const isFavorite = useCallback((id) => favoriteIds.has(id), [favoriteIds])

    // 乐观更新：先改界面，失败再回滚
    const toggleFavorite = async (id) => {
        if (!token) return false
        const wasFav = favoriteIds.has(id)
        const apply = (fav) => setFavoriteIds(prev => {
            const next = new Set(prev)
            fav ? next.add(id) : next.delete(id)
            return next
        })
        apply(!wasFav)
        try {
            const res = await authFetch(`/favorites/${id}`, { method: wasFav ? 'DELETE' : 'POST' })
            if (!res.ok) apply(wasFav)
        } catch {
            apply(wasFav)
        }
        return true
    }

    const getFavorites = async () => {
        const res = await authFetch('/favorites')
        return res.ok ? res.json() : []
    }

    return (
        <AuthContext.Provider value={{
            user, isLoggedIn: !!token && !!user, ready,
            login, register, logout,
            favoriteIds, isFavorite, toggleFavorite, getFavorites
        }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
