import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../utils/api'

function AdminLogin() {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const { ok, data } = await api.login(username, password)

            if (ok) {
                localStorage.setItem('adminToken', data.token)
                navigate('/admin')
            } else {
                setError(data.message || '登录失败')
            }
        } catch (err) {
            setError('网络错误，请稍后重试')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-logo">安澜・拾光</div>
                <div className="login-title">管理后台</div>

                <form onSubmit={handleSubmit}>
                    {error && (
                        <div style={{
                            padding: 'var(--space-3)',
                            marginBottom: 'var(--space-4)',
                            background: '#FDECEA',
                            color: '#C62828',
                            fontSize: 'var(--text-sm)',
                            textAlign: 'center',
                            borderRadius: 'var(--radius-md)'
                        }}>
                            {error}
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">用户名</label>
                        <input
                            type="text"
                            className="form-input"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="请输入用户名"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">密码</label>
                        <input
                            type="password"
                            className="form-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="请输入密码"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', marginTop: 'var(--space-4)' }}
                        disabled={loading}
                    >
                        {loading ? '登录中...' : '登录'}
                    </button>
                </form>

                <p style={{
                    marginTop: 'var(--space-8)',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--color-graphite)',
                    textAlign: 'center',
                    opacity: '0.6'
                }}>
                    默认账号：admin / pearl2024
                </p>
            </div>
        </div>
    )
}

export default AdminLogin
