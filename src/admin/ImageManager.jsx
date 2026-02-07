import { useState, useEffect, useRef } from 'react'
import { AdminLayout } from './Dashboard'
import { api } from '../utils/api'

function ImageManager() {
    const [images, setImages] = useState([])
    const [jewelry, setJewelry] = useState([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [selectedJewelry, setSelectedJewelry] = useState('')
    const fileInputRef = useRef(null)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            const [imagesData, jewelryData] = await Promise.all([
                api.getImages(),
                api.getJewelry()
            ])

            setImages(imagesData)
            setJewelry(jewelryData)
        } catch (error) {
            console.error('加载失败')
        } finally {
            setLoading(false)
        }
    }

    const handleUpload = async (e) => {
        const files = Array.from(e.target.files)
        if (!files.length) return

        setUploading(true)

        try {
            await api.uploadImages(files, selectedJewelry || null)
            loadData()
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
        if (!confirm('确定要删除此图片吗？')) return

        try {
            await api.deleteImage(id)
            loadData()
        } catch (error) {
            console.error('删除失败')
        }
    }

    const handleAssign = async (imageId, jewelryId) => {
        try {
            await api.updateImage(imageId, { jewelry_id: jewelryId || null })
            loadData()
        } catch (error) {
            console.error('更新失败')
        }
    }

    if (loading) {
        return (
            <AdminLayout title="图片管理">
                <div className="loading">
                    <div className="loading-spinner"></div>
                </div>
            </AdminLayout>
        )
    }

    return (
        <AdminLayout title="图片管理">
            {/* 上传区域 */}
            <div className="admin-card">
                <div className="admin-card-title">上传图片</div>

                <div className="flex" style={{ gap: 'var(--space-4)', marginBottom: 'var(--space-4)', alignItems: 'flex-end' }}>
                    <div className="form-group" style={{ margin: 0, flex: 1 }}>
                        <label className="form-label">关联饰品（可选）</label>
                        <select
                            className="form-input"
                            value={selectedJewelry}
                            onChange={(e) => setSelectedJewelry(e.target.value)}
                        >
                            <option value="">不关联</option>
                            {jewelry.map((item) => (
                                <option key={item.id} value={item.id}>{item.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div
                    className="upload-area"
                    onClick={() => fileInputRef.current?.click()}
                    style={{ opacity: uploading ? 0.5 : 1 }}
                >
                    <div className="upload-icon">📁</div>
                    <div className="upload-text">
                        {uploading ? '上传中...' : '点击或拖拽图片到此处上传'}
                    </div>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-graphite)', marginTop: 'var(--space-2)' }}>
                        支持 JPG、PNG、WebP 格式
                    </p>
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    style={{ display: 'none' }}
                    onChange={handleUpload}
                />
            </div>

            {/* 图片列表 */}
            <div className="admin-card">
                <div className="admin-card-title">图片库 ({images.length})</div>

                {images.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">🖼️</div>
                        <p>暂无图片，点击上方区域上传</p>
                    </div>
                ) : (
                    <div className="image-grid">
                        {images.map((image) => (
                            <div key={image.id} className="image-item">
                                <img src={image.path} alt={image.original_name} />
                                <div className="image-item-overlay">
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
                                <div style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    background: 'rgba(0,0,0,0.7)',
                                    padding: 'var(--space-2)',
                                    fontSize: 'var(--text-xs)'
                                }}>
                                    <select
                                        value={image.jewelry_id || ''}
                                        onChange={(e) => handleAssign(image.id, e.target.value)}
                                        style={{
                                            width: '100%',
                                            background: 'transparent',
                                            color: 'white',
                                            border: 'none',
                                            fontSize: 'var(--text-xs)'
                                        }}
                                    >
                                        <option value="" style={{ color: 'black' }}>未关联</option>
                                        {jewelry.map((item) => (
                                            <option key={item.id} value={item.id} style={{ color: 'black' }}>
                                                {item.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    )
}

export default ImageManager
