import { useState, useEffect } from 'react'
import { AdminLayout } from './Dashboard'
import { api } from '../utils/api'

function ContentEditor() {
    const [pages, setPages] = useState({})
    const [activePage, setActivePage] = useState('home')
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState('')
    const [uploading, setUploading] = useState(false)
    const [uploadError, setUploadError] = useState('')
    const [translating, setTranslating] = useState({})

    const pageConfigs = [
        {
            key: 'home',
            label: '首页',
            fields: [
                { name: 'philosophy_image', label: 'OUR PHILOSOPHY 图片', type: 'image', help: '建议尺寸：800x1000px，用于首页"品牌介绍"部分右侧展示' },
                { name: 'pearl_story_image', label: 'PEARL STORY 图片', type: 'image', help: '建议尺寸：800x1000px，用于首页"珍珠知识"部分右侧展示' }
            ]
        },
        {
            key: 'about',
            label: '品牌故事',
            fields: [
                { name: 'title', label: '页面标题（中文）', type: 'text' },
                { name: 'title_en', label: '页面标题（英文）', type: 'text' },
                { name: 'story', label: '品牌故事（中文）', type: 'textarea' },
                { name: 'story_en', label: '品牌故事（英文）', type: 'textarea' }
            ]
        },
        {
            key: 'contact',
            label: '联系页面',
            fields: [
                { name: 'address', label: '联系地址', type: 'text' },
                { name: 'phone', label: '联系电话', type: 'text' },
                { name: 'email', label: '电子邮箱', type: 'text' },
                { name: 'wechat', label: '微信号', type: 'text' },
                { name: 'xiaohongshu', label: '小红书', type: 'text' },
                { name: 'instagram', label: 'Instagram', type: 'text' }
            ]
        }
    ]

    useEffect(() => {
        loadContent()
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

    const loadContent = async () => {
        try {
            const data = await api.getPages()
            const pagesMap = {}
            data.forEach(page => {
                try {
                    pagesMap[page.page_key] = JSON.parse(page.content)
                } catch {
                    pagesMap[page.page_key] = {}
                }
            })
            setPages(pagesMap)
        } catch (error) {
            console.error('加载失败')
        }
    }

    const handleChange = (field, value) => {
        setPages(prev => ({
            ...prev,
            [activePage]: {
                ...prev[activePage],
                [field]: value
            }
        }))
    }

    const handleImageUpload = async (field, file) => {
        if (!file) return

        setUploading(true)
        setUploadError('')

        try {
            const result = await api.uploadImages([file])
            if (result.images && result.images[0]) {
                handleChange(field, result.images[0].path)
                setMessage('图片上传成功！')
                setTimeout(() => setMessage(''), 3000)
            }
        } catch (error) {
            setUploadError('图片上传失败')
        } finally {
            setUploading(false)
        }
    }

    const handleImageRemove = (field) => {
        handleChange(field, '')
    }

    const handleSave = async () => {
        setSaving(true)
        setMessage('')

        try {
            await api.updatePageContent(activePage, pages[activePage] || {})
            setMessage('保存成功！')
            setTimeout(() => setMessage(''), 3000)
        } catch (error) {
            setMessage('保存失败')
        } finally {
            setSaving(false)
        }
    }

    const currentConfig = pageConfigs.find(p => p.key === activePage)
    const currentContent = pages[activePage] || {}

    return (
        <AdminLayout title="内容编辑">
            <div className="flex" style={{ gap: 'var(--space-6)' }}>
                {/* 页面选择 */}
                <div className="admin-card" style={{ width: '200px', flexShrink: 0 }}>
                    <div className="admin-card-title">页面</div>
                    {pageConfigs.map(page => (
                        <button
                            key={page.key}
                            onClick={() => setActivePage(page.key)}
                            style={{
                                display: 'block',
                                width: '100%',
                                padding: 'var(--space-3) var(--space-4)',
                                marginBottom: 'var(--space-2)',
                                textAlign: 'left',
                                background: activePage === page.key ? 'var(--color-pearl-cream)' : 'transparent',
                                border: activePage === page.key ? '1px solid var(--color-champagne)' : '1px solid transparent',
                                cursor: 'pointer',
                                transition: 'all var(--transition-fast)'
                            }}
                        >
                            {page.label}
                        </button>
                    ))}
                </div>

                {/* 编辑区域 */}
                <div className="admin-card" style={{ flex: 1 }}>
                    <div className="flex-between" style={{ marginBottom: 'var(--space-6)' }}>
                        <div className="admin-card-title" style={{ margin: 0, border: 'none', padding: 0 }}>
                            编辑：{currentConfig?.label}
                        </div>
                        <button
                            className="btn btn-primary"
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? '保存中...' : '保存'}
                        </button>
                    </div>

                    {message && (
                        <div style={{
                            padding: 'var(--space-3)',
                            marginBottom: 'var(--space-4)',
                            background: message.includes('成功') ? '#D4EDDA' : '#FDECEA',
                            color: message.includes('成功') ? '#155724' : '#C62828',
                            borderRadius: 'var(--radius-md)',
                            fontSize: 'var(--text-sm)'
                        }}>
                            {message}
                        </div>
                    )}

                    {currentConfig?.fields.map(field => (
                        <div key={field.name} className="form-group">
                            <div className="flex-between">
                                <label className="form-label">
                                    {field.label}
                                    {field.help && (
                                        <span style={{
                                            marginLeft: 'var(--space-2)',
                                            fontSize: 'var(--text-sm)',
                                            color: 'var(--color-graphite)',
                                            fontWeight: 'normal'
                                        }}>
                                            ({field.help})
                                        </span>
                                    )}
                                </label>
                                {field.name.endsWith('_en') === false && currentConfig.fields.some(f => f.name === field.name + '_en' || (field.name === 'story' && f.name === 'story_en') || (field.name === 'title' && f.name === 'title_en')) && (
                                    <button
                                        type="button"
                                        className="btn-text"
                                        style={{ fontSize: '12px', color: 'var(--color-champagne)' }}
                                        onClick={() => {
                                            const targetField = field.name === 'story' ? 'story_en' : (field.name === 'title' ? 'title_en' : field.name + '_en');
                                            handleTranslate(field.name, currentContent[field.name], (val) => handleChange(targetField, val));
                                        }}
                                        disabled={translating[field.name]}
                                    >
                                        {translating[field.name] ? '翻译中...' : '翻译到英文'}
                                    </button>
                                )}
                            </div>
                            {field.type === 'image' ? (
                                <div>
                                    {currentContent[field.name] && (
                                        <div style={{ marginBottom: 'var(--space-4)', position: 'relative' }}>
                                            <img
                                                src={currentContent[field.name]}
                                                alt={field.label}
                                                style={{
                                                    maxWidth: '400px',
                                                    maxHeight: '500px',
                                                    border: '1px solid var(--color-silver)',
                                                    borderRadius: 'var(--radius-md)',
                                                    display: 'block'
                                                }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleImageRemove(field.name)}
                                                style={{
                                                    position: 'absolute',
                                                    top: 'var(--space-2)',
                                                    right: 'var(--space-2)',
                                                    background: 'rgba(0,0,0,0.6)',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: 'var(--radius-md)',
                                                    padding: 'var(--space-2) var(--space-3)',
                                                    cursor: 'pointer',
                                                    fontSize: 'var(--text-sm)'
                                                }}
                                            >
                                                删除图片
                                            </button>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0]
                                            if (file) {
                                                handleImageUpload(field.name, file)
                                            }
                                        }}
                                        disabled={uploading}
                                        style={{ display: 'block' }}
                                    />
                                    {uploading && (
                                        <div style={{ marginTop: 'var(--space-2)', color: 'var(--color-champagne)' }}>
                                            上传中...
                                        </div>
                                    )}
                                    {uploadError && (
                                        <div style={{ marginTop: 'var(--space-2)', color: '#C62828' }}>
                                            {uploadError}
                                        </div>
                                    )}
                                </div>
                            ) : field.type === 'textarea' ? (
                                <textarea
                                    className="form-input form-textarea"
                                    value={currentContent[field.name] || ''}
                                    onChange={(e) => handleChange(field.name, e.target.value)}
                                    rows={8}
                                    style={{ minHeight: '200px' }}
                                />
                            ) : (
                                <input
                                    type="text"
                                    className="form-input"
                                    value={currentContent[field.name] || ''}
                                    onChange={(e) => handleChange(field.name, e.target.value)}
                                />
                            )}
                        </div>
                    ))}

                    <div style={{
                        marginTop: 'var(--space-6)',
                        padding: 'var(--space-4)',
                        background: 'var(--color-mist)',
                        fontSize: 'var(--text-sm)',
                        color: 'var(--color-graphite)',
                        borderRadius: 'var(--radius-md)'
                    }}>
                        <strong>提示：</strong>修改后请点击"保存"按钮，刷新前台页面即可看到更新内容。
                    </div>
                </div>
            </div>
        </AdminLayout>
    )
}

export default ContentEditor
