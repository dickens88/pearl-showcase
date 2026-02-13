import { useState, useEffect, useRef } from 'react'
import { AdminLayout } from './Dashboard'
import { api } from '../utils/api'

function GalleryManager() {
    const [images, setImages] = useState([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [editingImage, setEditingImage] = useState(null)
    const [formData, setFormData] = useState({
        title: '',
        title_en: '',
        alt: ''
    })
    const [translating, setTranslating] = useState({})
    const fileInputRef = useRef(null)

    useEffect(() => {
        loadImages()
    }, [])

    const handleTranslate = async (field, text, callback) => {
        if (!text) return;
        setTranslating(prev => ({ ...prev, [field]: true }));
        try {
            const data = await api.translate(text);
            if (data.translatedText) {
                callback(data.translatedText);
            }
        } catch (error) {
            console.error('翻译失败:', error);
            alert('翻译失败，请稍后重试');
        } finally {
            setTranslating(prev => ({ ...prev, [field]: false }));
        }
    };

    const loadImages = async () => {
        try {
            const data = await api.getAllGalleryImages()
            setImages(data)
        } catch (error) {
            console.error('加载失败')
        } finally {
            setLoading(false)
        }
    }

    const handleUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        setUploading(true)

        try {
            await api.uploadGalleryImage(file, formData.title, formData.title_en, formData.alt)
            loadImages()
            setFormData({ title: '', title_en: '', alt: '' })
        } catch (error) {
            console.error('上传失败')
        } finally {
            setUploading(false)
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('确定要删除此展廊图片吗？')) return

        try {
            await api.deleteGalleryImage(id)
            loadImages()
        } catch (error) {
            console.error('删除失败')
        }
    }

    const handleToggleVisibility = async (image) => {
        try {
            await api.updateGalleryImage(image.id, { is_visible: !image.is_visible })
            loadImages()
        } catch (error) {
            console.error('更新失败')
        }
    }

    const handleEdit = (image) => {
        setEditingImage(image)
        setFormData({
            title: image.title || '',
            title_en: image.title_en || '',
            alt: image.alt || ''
        })
    }

    const handleSaveEdit = async () => {
        if (!editingImage) return

        try {
            await api.updateGalleryImage(editingImage.id, formData)
            loadImages()
            setEditingImage(null)
            setFormData({ title: '', title_en: '', alt: '' })
        } catch (error) {
            console.error('更新失败')
        }
    }

    const handleMoveUp = async (index) => {
        if (index === 0) return
        const newImages = [...images]
            ;[newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]]

        const orderList = newImages.map((img, i) => ({ id: img.id, order_index: i }))
        try {
            await api.reorderGalleryImages(orderList)
            loadImages()
        } catch (error) {
            console.error('排序失败')
        }
    }

    const handleMoveDown = async (index) => {
        if (index === images.length - 1) return
        const newImages = [...images]
            ;[newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]]

        const orderList = newImages.map((img, i) => ({ id: img.id, order_index: i }))
        try {
            await api.reorderGalleryImages(orderList)
            loadImages()
        } catch (error) {
            console.error('排序失败')
        }
    }

    if (loading) {
        return (
            <AdminLayout title="展廊管理">
                <div className="loading">
                    <div className="loading-spinner"></div>
                </div>
            </AdminLayout>
        )
    }

    return (
        <AdminLayout title="展廊管理">
            {/* 上传区域 */}
            <div className="admin-card">
                <div className="admin-card-title">上传展廊图片</div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                        <div className="flex-between">
                            <label className="form-label">标题 (中文)</label>
                            <button
                                type="button"
                                className="btn-text"
                                style={{ fontSize: '11px', color: 'var(--color-champagne)', padding: 0 }}
                                onClick={() => handleTranslate('title', formData.title, (val) => setFormData({ ...formData, title_en: val }))}
                                disabled={translating['title']}
                            >
                                {translating['title'] ? '...' : '翻译'}
                            </button>
                        </div>
                        <input
                            type="text"
                            className="form-input"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="如：金色南洋珍珠细节"
                        />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">标题 (英文)</label>
                        <input
                            type="text"
                            className="form-input"
                            value={formData.title_en}
                            onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                            placeholder="如：Golden South Sea Pearl"
                        />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Alt 描述</label>
                        <input
                            type="text"
                            className="form-input"
                            value={formData.alt}
                            onChange={(e) => setFormData({ ...formData, alt: e.target.value })}
                            placeholder="图片描述文字"
                        />
                    </div>
                </div>

                <div
                    className="upload-area"
                    onClick={() => fileInputRef.current?.click()}
                    style={{ opacity: uploading ? 0.5 : 1 }}
                >
                    <div className="upload-icon">🖼️</div>
                    <div className="upload-text">
                        {uploading ? '上传中...' : '点击或拖拽图片到此处上传'}
                    </div>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-graphite)', marginTop: 'var(--space-2)' }}>
                        支持 JPG、PNG、WebP 格式，建议尺寸 800x800 或更大
                    </p>
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    style={{ display: 'none' }}
                    onChange={handleUpload}
                />
            </div>

            {/* 图片列表 */}
            <div className="admin-card">
                <div className="admin-card-title">展廊图片列表 ({images.length})</div>

                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-graphite)', marginBottom: 'var(--space-4)' }}>
                    首页艺术展廊将按顺序展示以下可见的图片。使用上下箭头调整顺序。
                </p>

                {images.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">🖼️</div>
                        <p>暂无展廊图片，点击上方区域上传</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                        {images.map((image, index) => (
                            <div
                                key={image.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--space-4)',
                                    padding: 'var(--space-4)',
                                    background: image.is_visible ? 'var(--color-pearl-cream)' : 'var(--color-mist)',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--color-gray-200)',
                                    opacity: image.is_visible ? 1 : 0.6
                                }}
                            >
                                {/* 排序按钮 */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <button
                                        onClick={() => handleMoveUp(index)}
                                        disabled={index === 0}
                                        style={{
                                            width: '28px',
                                            height: '28px',
                                            border: '1px solid var(--color-gray-300)',
                                            background: 'white',
                                            borderRadius: 'var(--radius-sm)',
                                            cursor: index === 0 ? 'not-allowed' : 'pointer',
                                            opacity: index === 0 ? 0.3 : 1
                                        }}
                                    >
                                        ↑
                                    </button>
                                    <button
                                        onClick={() => handleMoveDown(index)}
                                        disabled={index === images.length - 1}
                                        style={{
                                            width: '28px',
                                            height: '28px',
                                            border: '1px solid var(--color-gray-300)',
                                            background: 'white',
                                            borderRadius: 'var(--radius-sm)',
                                            cursor: index === images.length - 1 ? 'not-allowed' : 'pointer',
                                            opacity: index === images.length - 1 ? 0.3 : 1
                                        }}
                                    >
                                        ↓
                                    </button>
                                </div>

                                {/* 缩略图 */}
                                <img
                                    src={image.path}
                                    alt={image.alt || image.title}
                                    style={{
                                        width: '100px',
                                        height: '100px',
                                        objectFit: 'cover',
                                        borderRadius: 'var(--radius-sm)'
                                    }}
                                />

                                {/* 信息 */}
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, marginBottom: 'var(--space-1)' }}>
                                        {image.title || '(无标题)'}
                                    </div>
                                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-graphite)' }}>
                                        {image.title_en || '(No English title)'}
                                    </div>
                                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-gray-500)', marginTop: 'var(--space-1)' }}>
                                        Alt: {image.alt || '(无描述)'}
                                    </div>
                                </div>

                                {/* 操作按钮 */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                    <div
                                        className={`switch ${image.is_visible ? 'active' : ''}`}
                                        onClick={() => handleToggleVisibility(image)}
                                        title={image.is_visible ? '点击隐藏' : '点击显示'}
                                    />
                                    <button
                                        className="btn btn-outline btn-icon"
                                        onClick={() => handleEdit(image)}
                                        title="编辑"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                        </svg>
                                    </button>
                                    <button
                                        className="btn btn-danger btn-icon"
                                        onClick={() => handleDelete(image.id)}
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
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 编辑弹窗 */}
            {editingImage && (
                <div
                    className="modal-overlay active"
                    onClick={() => setEditingImage(null)}
                >
                    <div
                        className="modal-content"
                        onClick={(e) => e.stopPropagation()}
                        style={{ padding: 'var(--space-8)', maxWidth: '500px' }}
                    >
                        <h2 style={{
                            fontFamily: "'Microsoft YaHei', '微软雅黑', sans-serif",
                            fontSize: '20px',
                            marginBottom: 'var(--space-6)',
                            fontWeight: 600
                        }}>
                            编辑展廊图片
                        </h2>

                        <div style={{ textAlign: 'center', marginBottom: 'var(--space-4)' }}>
                            <img
                                src={editingImage.path}
                                alt={editingImage.alt}
                                style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'contain', borderRadius: 'var(--radius-md)' }}
                            />
                        </div>

                        <div className="form-group">
                            <div className="flex-between">
                                <label className="form-label">标题 (中文)</label>
                                <button
                                    type="button"
                                    className="btn-text"
                                    style={{ fontSize: '12px', color: 'var(--color-champagne)' }}
                                    onClick={() => handleTranslate('edit_title', formData.title, (val) => setFormData({ ...formData, title_en: val }))}
                                    disabled={translating['edit_title']}
                                >
                                    {translating['edit_title'] ? '翻译中...' : '翻译到英文'}
                                </button>
                            </div>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">标题 (英文)</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.title_en}
                                onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Alt 描述</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.alt}
                                onChange={(e) => setFormData({ ...formData, alt: e.target.value })}
                            />
                        </div>

                        <div className="flex" style={{ gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
                            <button className="btn btn-primary" onClick={handleSaveEdit}>
                                保存
                            </button>
                            <button className="btn btn-outline" onClick={() => setEditingImage(null)}>
                                取消
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    )
}

export default GalleryManager
