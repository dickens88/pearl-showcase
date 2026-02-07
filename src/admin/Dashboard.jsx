import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { api } from '../utils/api'

function AdminLayout({ children, title }) {
    const navigate = useNavigate()
    const location = useLocation()
    const [showPasswordModal, setShowPasswordModal] = useState(false)

    useEffect(() => {
        const token = localStorage.getItem('adminToken')
        if (!token) {
            navigate('/admin/login')
        }
    }, [navigate])

    const handleLogout = () => {
        localStorage.removeItem('adminToken')
        navigate('/admin/login')
    }

    const navItems = [
        { path: '/admin', label: '仪表板', icon: '📊' },
        { path: '/admin/jewelry', label: '饰品管理', icon: '💎' },
        { path: '/admin/images', label: '图片管理', icon: '🖼️' },
        { path: '/admin/gallery', label: '展廊管理', icon: '🎨' },
        { path: '/admin/content', label: '内容编辑', icon: '📝' },
    ]

    return (
        <div className="admin-layout">
            <aside className="admin-sidebar">
                <div className="admin-sidebar-logo">
                    管理后台
                </div>
                <nav className="admin-nav">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`admin-nav-item ${location.pathname === item.path ? 'active' : ''}`}
                        >
                            <span>{item.icon}</span>
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>
                <div style={{
                    padding: 'var(--space-6)',
                    marginTop: 'auto',
                    borderTop: '1px solid rgba(255,255,255,0.1)'
                }}>
                    <button
                        onClick={() => setShowPasswordModal(true)}
                        className="admin-nav-item"
                        style={{ width: '100%', marginBottom: 'var(--space-2)' }}
                    >
                        <span>🔒</span>
                        <span>修改密码</span>
                    </button>
                    <button
                        onClick={handleLogout}
                        className="admin-nav-item"
                        style={{ width: '100%' }}
                    >
                        <span>🚪</span>
                        <span>退出登录</span>
                    </button>
                    <Link
                        to="/"
                        target="_blank"
                        className="admin-nav-item"
                        style={{ marginTop: 'var(--space-2)' }}
                    >
                        <span>🌐</span>
                        <span>查看网站</span>
                    </Link>
                </div>
            </aside>

            <main className="admin-main">
                <header className="admin-header">
                    <h1 className="admin-title">{title}</h1>
                </header>
                {children}
            </main>

            <ChangePasswordModal
                isOpen={showPasswordModal}
                onClose={() => setShowPasswordModal(false)}
            />
        </div>
    )
}

function ChangePasswordModal({ isOpen, onClose }) {
    const [formData, setFormData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    })
    const [message, setMessage] = useState({ type: '', text: '' })
    const [loading, setLoading] = useState(false)

    // 实时校验新密码是否一致
    const isMismatch = formData.newPassword && formData.confirmPassword && formData.newPassword !== formData.confirmPassword;

    if (!isOpen) return null

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (formData.newPassword !== formData.confirmPassword) {
            setMessage({ type: 'error', text: '两次输入的新密码不一致' })
            return
        }
        if (formData.newPassword.length < 6) {
            setMessage({ type: 'error', text: '新密码不能少于6位' })
            return
        }

        setLoading(true)
        setMessage({ type: '', text: '' })

        try {
            const res = await api.changePassword(formData.oldPassword, formData.newPassword)
            if (res.ok) {
                setMessage({ type: 'success', text: '密码修改成功' })
                setTimeout(() => {
                    handleClose()
                }, 1500)
            } else {
                setMessage({ type: 'error', text: res.data.message || '修改失败' })
            }
        } catch (error) {
            setMessage({ type: 'error', text: '发生错误，请重试' })
        } finally {
            setLoading(false)
        }
    }

    const handleClose = () => {
        onClose()
        setFormData({ oldPassword: '', newPassword: '', confirmPassword: '' })
        setMessage({ type: '', text: '' })
    }

    return (
        <div className="modal-overlay active" onClick={handleClose}>
            <div
                className="modal-content"
                onClick={e => e.stopPropagation()}
                style={{
                    maxWidth: '440px',
                    padding: 'var(--space-8)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                    background: 'white',
                    position: 'relative',
                    border: '1px solid var(--color-silver)'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-6)' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: 'rgba(201, 169, 98, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--color-champagne)'
                    }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                    </div>
                    <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--color-charcoal)', margin: 0 }}>安全设置</h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-graphite)', opacity: 0.7, margin: 0 }}>定期修改密码以保障账户安全</p>
                    </div>
                </div>

                {message.text && (
                    <div style={{
                        padding: '10px',
                        marginBottom: '15px',
                        background: message.type === 'error' ? 'rgba(255, 0, 0, 0.1)' : 'rgba(0, 255, 0, 0.1)',
                        color: message.type === 'error' ? '#ff4d4f' : '#52c41a',
                        borderRadius: '4px',
                        fontSize: '0.9rem'
                    }}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">当前密码</label>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="输入旧密码验证身份"
                            value={formData.oldPassword}
                            onChange={(e) => setFormData({ ...formData, oldPassword: e.target.value })}
                            required
                        />
                    </div>

                    <div style={{ borderTop: '1px dashed var(--color-silver)', margin: 'var(--space-6) 0' }}></div>

                    <div className="form-group">
                        <label className="form-label">新密码</label>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="至少6位字符"
                            value={formData.newPassword}
                            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                            required
                            style={isMismatch ? { borderColor: '#ff4d4f' } : {}}
                        />
                    </div>

                    <div className="form-group" style={{ marginBottom: isMismatch ? 'var(--space-2)' : 'var(--space-8)' }}>
                        <label className="form-label">确认新密码</label>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="再次输入新密码"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            required
                            style={isMismatch ? { borderColor: '#ff4d4f' } : {}}
                        />
                    </div>

                    {isMismatch && (
                        <div style={{ color: '#ff4d4f', fontSize: '0.8rem', marginBottom: 'var(--space-6)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            密码不一致，请重新确认
                        </div>
                    )}

                    <div className="flex" style={{ justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
                        <button type="button" className="btn btn-outline" onClick={handleClose} style={{ flex: 1 }}>取消</button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading || isMismatch}
                            style={{ flex: 2, position: 'relative' }}
                        >
                            {loading ? '提交中...' : '确认修改'}
                        </button>
                    </div>
                </form>

                <button
                    onClick={handleClose}
                    style={{
                        position: 'absolute',
                        top: 'var(--space-4)',
                        right: 'var(--space-4)',
                        color: 'var(--color-graphite)',
                        opacity: 0.5,
                        padding: '4px'
                    }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
        </div>
    )
}

function Dashboard() {
    const [stats, setStats] = useState({
        jewelryCount: 0,
        imageCount: 0,
        visibleCount: 0
    })
    const [analytics, setAnalytics] = useState({
        todayPV: 0,
        todayUV: 0,
        weekPV: 0,
        monthPV: 0,
        totalPV: 0,
        topPages: [],
        dailyStats: []
    })

    useEffect(() => {
        loadStats()
        loadAnalytics()
    }, [])

    const loadStats = async () => {
        try {
            const data = await api.getStats()
            setStats(data)
        } catch (error) {
            console.log('加载统计数据失败')
        }
    }

    const loadAnalytics = async () => {
        try {
            const data = await api.getAnalytics()
            setAnalytics(data)
        } catch (error) {
            console.log('加载访问分析失败')
        }
    }

    // 页面路径名称映射
    const pageNameMap = {
        '/': '首页',
        '/gallery': '珍品陈列',
        '/about': '品牌美学',
        '/knowledge': '珍珠溯源',
        '/contact': '联系我们'
    }

    // 计算柱状图最大值
    const maxPV = Math.max(...analytics.dailyStats.map(d => d.pv), 1)

    return (
        <AdminLayout title="仪表板">
            {/* 内容统计 */}
            <div className="admin-card-title" style={{ marginBottom: 'var(--space-4)' }}>内容统计</div>
            <div className="grid" style={{
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: 'var(--space-4)'
            }}>
                <div className="admin-card" style={{ textAlign: 'center' }}>
                    <div style={{
                        fontSize: 'var(--text-3xl)',
                        color: 'var(--color-champagne)',
                        marginBottom: 'var(--space-2)'
                    }}>
                        {stats.jewelryCount}
                    </div>
                    <div style={{ color: 'var(--color-graphite)', fontSize: 'var(--text-sm)' }}>饰品总数</div>
                </div>

                <div className="admin-card" style={{ textAlign: 'center' }}>
                    <div style={{
                        fontSize: 'var(--text-3xl)',
                        color: 'var(--color-champagne)',
                        marginBottom: 'var(--space-2)'
                    }}>
                        {stats.imageCount}
                    </div>
                    <div style={{ color: 'var(--color-graphite)', fontSize: 'var(--text-sm)' }}>图片总数</div>
                </div>

                <div className="admin-card" style={{ textAlign: 'center' }}>
                    <div style={{
                        fontSize: 'var(--text-3xl)',
                        color: 'var(--color-champagne)',
                        marginBottom: 'var(--space-2)'
                    }}>
                        {stats.visibleCount}
                    </div>
                    <div style={{ color: 'var(--color-graphite)', fontSize: 'var(--text-sm)' }}>展示中</div>
                </div>
            </div>

            {/* 访问统计 */}
            <div className="admin-card-title" style={{ marginTop: 'var(--space-8)', marginBottom: 'var(--space-4)' }}>访问统计</div>
            <div className="grid" style={{
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: 'var(--space-4)'
            }}>
                <div className="admin-card" style={{ textAlign: 'center' }}>
                    <div style={{
                        fontSize: 'var(--text-3xl)',
                        color: '#4CAF50',
                        marginBottom: 'var(--space-2)'
                    }}>
                        {analytics.todayPV}
                    </div>
                    <div style={{ color: 'var(--color-graphite)', fontSize: 'var(--text-sm)' }}>今日访问 (PV)</div>
                </div>

                <div className="admin-card" style={{ textAlign: 'center' }}>
                    <div style={{
                        fontSize: 'var(--text-3xl)',
                        color: '#2196F3',
                        marginBottom: 'var(--space-2)'
                    }}>
                        {analytics.todayUV}
                    </div>
                    <div style={{ color: 'var(--color-graphite)', fontSize: 'var(--text-sm)' }}>今日访客 (UV)</div>
                </div>

                <div className="admin-card" style={{ textAlign: 'center' }}>
                    <div style={{
                        fontSize: 'var(--text-3xl)',
                        color: '#FF9800',
                        marginBottom: 'var(--space-2)'
                    }}>
                        {analytics.weekPV}
                    </div>
                    <div style={{ color: 'var(--color-graphite)', fontSize: 'var(--text-sm)' }}>本周访问</div>
                </div>

                <div className="admin-card" style={{ textAlign: 'center' }}>
                    <div style={{
                        fontSize: 'var(--text-3xl)',
                        color: '#9C27B0',
                        marginBottom: 'var(--space-2)'
                    }}>
                        {analytics.monthPV}
                    </div>
                    <div style={{ color: 'var(--color-graphite)', fontSize: 'var(--text-sm)' }}>本月访问</div>
                </div>

                <div className="admin-card" style={{ textAlign: 'center' }}>
                    <div style={{
                        fontSize: 'var(--text-3xl)',
                        color: 'var(--color-champagne)',
                        marginBottom: 'var(--space-2)'
                    }}>
                        {analytics.totalPV}
                    </div>
                    <div style={{ color: 'var(--color-graphite)', fontSize: 'var(--text-sm)' }}>累计访问</div>
                </div>
            </div>

            {/* 访问趋势和热门页面 */}
            <div className="grid" style={{
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: 'var(--space-6)',
                marginTop: 'var(--space-6)'
            }}>
                {/* 最近7天趋势 */}
                <div className="admin-card">
                    <div className="admin-card-title">最近7天访问趋势</div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--space-2)', height: '120px', marginTop: 'var(--space-4)' }}>
                        {analytics.dailyStats.map((day, index) => (
                            <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div style={{
                                    width: '100%',
                                    height: `${(day.pv / maxPV) * 100}px`,
                                    minHeight: '4px',
                                    background: 'linear-gradient(to top, var(--color-champagne), rgba(212, 190, 163, 0.5))',
                                    borderRadius: '4px 4px 0 0',
                                    transition: 'height 0.3s ease'
                                }} title={`${day.date}: ${day.pv} 次访问`} />
                                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-graphite)', marginTop: 'var(--space-1)' }}>
                                    {day.date}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 热门页面 */}
                <div className="admin-card">
                    <div className="admin-card-title">热门页面 Top 5</div>
                    <div style={{ marginTop: 'var(--space-4)' }}>
                        {analytics.topPages.length === 0 ? (
                            <div style={{ color: 'var(--color-graphite)', textAlign: 'center', padding: 'var(--space-4)' }}>
                                暂无数据
                            </div>
                        ) : (
                            analytics.topPages.map((page, index) => (
                                <div key={index} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: 'var(--space-2) 0',
                                    borderBottom: index < analytics.topPages.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none'
                                }}>
                                    <span style={{ color: 'var(--color-ivory)' }}>
                                        <span style={{
                                            display: 'inline-block',
                                            width: '20px',
                                            height: '20px',
                                            lineHeight: '20px',
                                            textAlign: 'center',
                                            background: index < 3 ? 'var(--color-champagne)' : 'rgba(255,255,255,0.1)',
                                            color: index < 3 ? 'var(--color-onyx)' : 'var(--color-ivory)',
                                            borderRadius: '4px',
                                            fontSize: 'var(--text-xs)',
                                            marginRight: 'var(--space-2)'
                                        }}>
                                            {index + 1}
                                        </span>
                                        {pageNameMap[page.path] || page.path}
                                    </span>
                                    <span style={{ color: 'var(--color-champagne)' }}>{page.count} 次</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <div className="admin-card" style={{ marginTop: 'var(--space-6)' }}>
                <div className="admin-card-title">快捷操作</div>
                <div className="flex" style={{ gap: 'var(--space-4)', flexWrap: 'wrap' }}>
                    <Link to="/admin/jewelry" className="btn btn-primary">
                        添加新饰品
                    </Link>
                    <Link to="/admin/images" className="btn btn-secondary">
                        上传图片
                    </Link>
                    <Link to="/admin/content" className="btn btn-outline">
                        编辑页面内容
                    </Link>
                </div>
            </div>

            <div className="admin-card" style={{ marginTop: 'var(--space-6)' }}>
                <div className="admin-card-title">使用说明</div>
                <div style={{ color: 'var(--color-graphite)', lineHeight: '1.8' }}>
                    <p><strong>饰品管理</strong>：添加、编辑、删除珍珠饰品，可设置展示顺序和可见状态。</p>
                    <p><strong>图片管理</strong>：上传饰品图片，支持JPG、PNG、WebP格式。</p>
                    <p><strong>内容编辑</strong>：编辑首页、关于页等页面的文字内容。</p>
                    <p><strong>访问统计</strong>：查看网站访问数据，仅统计同意Cookie的用户。</p>
                </div>
            </div>
        </AdminLayout>
    )
}

export default Dashboard
export { AdminLayout }
