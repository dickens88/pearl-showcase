import { useState, useEffect } from 'react'
import { AdminLayout } from './Dashboard'
import { api } from '../utils/api'

function JewelryManager() {
    const [jewelry, setJewelry] = useState([])
    const [loading, setLoading] = useState(true)
    const [editingItem, setEditingItem] = useState(null)
    const [showForm, setShowForm] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        name_en: '',
        category: 'earrings',
        description: '',
        description_en: '',
        is_visible: true,
        is_featured: false,
        order_index: 0
    })

    useEffect(() => {
        loadJewelry()
    }, [])

    const loadJewelry = async () => {
        try {
            const data = await api.getJewelry({ all: true })
            setJewelry(data)
        } catch (error) {
            console.error('加载失败')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        try {
            if (editingItem) {
                await api.updateJewelry(editingItem.id, formData)
                // 同时保存图片的描述
                if (editingItem.images && editingItem.images.length > 0) {
                    await Promise.all(editingItem.images.map(img =>
                        api.updateImage(img.id, {
                            description: img.description,
                            description_en: img.description_en
                        })
                    ))
                }
            } else {
                await api.createJewelry(formData)
            }
            loadJewelry()
            resetForm()
        } catch (error) {
            console.error('保存失败')
        }
    }

    const handleEdit = (item) => {
        setEditingItem(item)
        setFormData({
            name: item.name,
            name_en: item.name_en || '',
            category: item.category || 'earrings',
            description: item.description,
            description_en: item.description_en || '',
            is_visible: item.is_visible,
            is_featured: item.is_featured,
            order_index: item.order_index
        })
        setShowForm(true)
    }

    const handleDelete = async (id) => {
        if (!confirm('确定要删除此饰品吗？')) return

        try {
            await api.deleteJewelry(id)
            loadJewelry()
        } catch (error) {
            console.error('删除失败')
        }
    }

    const toggleVisibility = async (item) => {
        try {
            await api.updateJewelry(item.id, { is_visible: !item.is_visible })
            loadJewelry()
        } catch (error) {
            console.error('更新失败')
        }
    }

    const toggleFeatured = async (item) => {
        try {
            await api.updateJewelry(item.id, { is_featured: !item.is_featured })
            loadJewelry()
        } catch (error) {
            console.error('更新失败')
        }
    }

    const resetForm = () => {
        setEditingItem(null)
        setShowForm(false)
        setFormData({
            name: '',
            name_en: '',
            category: 'earrings',
            description: '',
            description_en: '',
            is_visible: true,
            is_featured: false,
            order_index: 0
        })
    }

    if (loading) {
        return (
            <AdminLayout title="饰品管理">
                <div className="loading">
                    <div className="loading-spinner"></div>
                </div>
            </AdminLayout>
        )
    }

    return (
        <AdminLayout title="饰品管理">
            <div className="admin-card">
                <div className="flex-between" style={{ marginBottom: 'var(--space-6)' }}>
                    <div className="admin-card-title" style={{ margin: 0, border: 'none', padding: 0 }}>
                        饰品列表
                    </div>
                    <button
                        className="btn btn-primary"
                        onClick={() => setShowForm(true)}
                    >
                        + 添加饰品
                    </button>
                </div>

                {jewelry.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">💎</div>
                        <p>暂无饰品，点击上方按钮添加</p>
                    </div>
                ) : (
                    <table className="table">
                        <thead>
                            <tr>
                                <th style={{ width: '60px' }}>排序</th>
                                <th>名称</th>
                                <th>类别</th>
                                <th>描述</th>
                                <th style={{ width: '80px' }}>图片</th>
                                <th style={{ width: '100px' }}>前台展示</th>
                                <th style={{ width: '100px' }}>首页精选</th>
                                <th style={{ width: '100px' }}>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {jewelry.map((item) => (
                                <tr key={item.id}>
                                    <td>{item.order_index}</td>
                                    <td>
                                        <strong>{item.name}</strong><br />
                                        <small style={{ color: 'var(--color-graphite)' }}>{item.name_en}</small>
                                    </td>
                                    <td><span className="badge">{
                                        {
                                            'earrings': '耳饰',
                                            'rings': '戒指',
                                            'necklaces': '项链',
                                            'bracelets': '手链',
                                            'brooches': '胸针',
                                            'sets': '套装',
                                            'baroque': '巴洛克',
                                            'designer': '设计师款',
                                            'pendants': '套装',
                                            '吊坠': '套装'
                                        }[item.category] || item.category || '未分类'
                                    }</span></td>
                                    <td style={{
                                        maxWidth: '300px',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {item.description}
                                    </td>
                                    <td>{item.images?.length || 0}张</td>
                                    <td>
                                        <div
                                            className={`switch ${item.is_visible ? 'active' : ''}`}
                                            onClick={() => toggleVisibility(item)}
                                            title={item.is_visible ? '点击隐藏' : '点击展示'}
                                        />
                                    </td>
                                    <td>
                                        <div
                                            className={`switch ${item.is_featured ? 'active' : ''}`}
                                            onClick={() => toggleFeatured(item)}
                                            title={item.is_featured ? '点击取消精选' : '点击设为精选'}
                                        />
                                    </td>
                                    <td>
                                        <div className="flex" style={{ gap: 'var(--space-2)' }}>
                                            <button
                                                className="btn btn-outline btn-icon"
                                                onClick={() => handleEdit(item)}
                                                title="编辑"
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                </svg>
                                            </button>
                                            <button
                                                className="btn btn-danger btn-icon"
                                                onClick={() => handleDelete(item.id)}
                                                title="删除"
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="3 6 5 6 21 6" />
                                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                    <line x1="10" y1="11" x2="10" y2="17" />
                                                    <line x1="14" y1="11" x2="14" y2="17" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* 添加/编辑表单弹窗 */}
            {showForm && (
                <div
                    className="modal-overlay active"
                    onClick={resetForm}
                >
                    <div
                        className="modal-content"
                        onClick={(e) => e.stopPropagation()}
                        style={{ padding: 'var(--space-8)', maxWidth: '900px', width: '90vw' }}
                    >
                        <h2 style={{
                            fontFamily: "'Microsoft YaHei', '微软雅黑', sans-serif",
                            fontSize: '20px',
                            marginBottom: 'var(--space-6)',
                            fontWeight: 600
                        }}>
                            {editingItem ? '编辑饰品' : '添加饰品'}
                        </h2>

                        <form onSubmit={handleSubmit}>
                            {/* 第一行：中英文名称 */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">饰品名称 (中文)</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="如：月光耳坠"
                                        required
                                    />
                                </div>

                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">饰品名称 (英文)</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.name_en}
                                        onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                                        placeholder="如：Moonlight Earrings"
                                    />
                                </div>
                            </div>

                            {/* 第二行：中文描述 */}
                            <div className="form-group">
                                <label className="form-label">描述 (中文)</label>
                                <textarea
                                    className="form-input form-textarea"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="描述饰品的材质、设计灵感、风格特点..."
                                    rows={3}
                                />
                            </div>

                            {/* 第三行：英文描述 */}
                            <div className="form-group">
                                <label className="form-label">描述 (英文)</label>
                                <textarea
                                    className="form-input form-textarea"
                                    value={formData.description_en}
                                    onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                                    placeholder="Describe contents in English..."
                                    rows={3}
                                />
                            </div>

                            {/* 第四行：类别和排序 */}
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">类别</label>
                                    <select
                                        className="form-input"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        <option value="earrings">耳饰</option>
                                        <option value="rings">戒指</option>
                                        <option value="necklaces">项链</option>
                                        <option value="bracelets">手链</option>
                                        <option value="brooches">胸针</option>
                                        <option value="sets">套装</option>
                                        <option value="baroque">巴洛克</option>
                                        <option value="designer">设计师款</option>
                                    </select>
                                </div>

                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">排序序号</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={formData.order_index}
                                        onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
                                        min="0"
                                    />
                                </div>
                            </div>

                            {/* 第五行：开关选项 */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label flex" style={{ alignItems: 'center', gap: 'var(--space-3)' }}>
                                        <div
                                            className={`switch ${formData.is_visible ? 'active' : ''}`}
                                            onClick={() => setFormData({ ...formData, is_visible: !formData.is_visible })}
                                        />
                                        <span>前台展示</span>
                                    </label>
                                </div>

                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label flex" style={{ alignItems: 'center', gap: 'var(--space-3)' }}>
                                        <div
                                            className={`switch ${formData.is_featured ? 'active' : ''}`}
                                            onClick={() => setFormData({ ...formData, is_featured: !formData.is_featured })}
                                        />
                                        <span>首页精选展示</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex" style={{ gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
                                <button type="submit" className="btn btn-primary">
                                    保存
                                </button>
                                <button type="button" className="btn btn-outline" onClick={resetForm}>
                                    取消
                                </button>
                            </div>

                            {/* 图片特定说明编辑 */}
                            {editingItem && editingItem.images && editingItem.images.length > 0 && (
                                <div className="form-group" style={{ marginTop: 'var(--space-8)', borderTop: '1px solid #efefef', paddingTop: 'var(--space-6)' }}>
                                    <label className="form-label" style={{ fontSize: '16px', fontWeight: 600, marginBottom: 'var(--space-4)' }}>
                                        各展示图特定描述 (可选)
                                    </label>
                                    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
                                        {editingItem.images.map((img, index) => (
                                            <div key={img.id} style={{
                                                display: 'flex',
                                                gap: 'var(--space-4)',
                                                padding: 'var(--space-3)',
                                                background: '#f8f9fa',
                                                borderRadius: '8px',
                                                border: '1px solid #eee'
                                            }}>
                                                <div style={{ position: 'relative' }}>
                                                    <img
                                                        src={img.path}
                                                        style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '4px' }}
                                                        alt=""
                                                    />
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: '-8px',
                                                        left: '-8px',
                                                        background: 'var(--color-champagne)',
                                                        color: 'white',
                                                        width: '24px',
                                                        height: '24px',
                                                        borderRadius: '50%',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '12px'
                                                    }}>
                                                        {index + 1}
                                                    </div>
                                                </div>
                                                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                                        <label className="form-label" style={{ fontSize: '12px', marginBottom: '4px' }}>中文描述</label>
                                                        <textarea
                                                            placeholder="此图片的中文说明"
                                                            className="form-input"
                                                            style={{ height: '70px', fontSize: '13px', padding: '8px' }}
                                                            value={img.description || ''}
                                                            onChange={(e) => {
                                                                const newImages = [...editingItem.images];
                                                                newImages[index] = { ...newImages[index], description: e.target.value };
                                                                setEditingItem({ ...editingItem, images: newImages });
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                                        <label className="form-label" style={{ fontSize: '12px', marginBottom: '4px' }}>英文描述</label>
                                                        <textarea
                                                            placeholder="English description"
                                                            className="form-input"
                                                            style={{ height: '70px', fontSize: '13px', padding: '8px' }}
                                                            value={img.description_en || ''}
                                                            onChange={(e) => {
                                                                const newImages = [...editingItem.images];
                                                                newImages[index] = { ...newImages[index], description_en: e.target.value };
                                                                setEditingItem({ ...editingItem, images: newImages });
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <p style={{ fontSize: '12px', color: '#888', marginTop: 'var(--space-3)' }}>
                                        * 提示：为特定图片设置描述后，在前台切换到该图时将优先显示此处内容。若留空则显示饰品主描述。
                                    </p>
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            )
            }
        </AdminLayout >
    )
}

export default JewelryManager
