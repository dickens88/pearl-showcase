const API_BASE = '/api'

// 获取认证头
export const getAuthHeader = () => {
    const token = localStorage.getItem('adminToken')
    return token ? {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    } : {
        'Content-Type': 'application/json'
    }
}

// 统一请求处理
const request = async (endpoint, options = {}) => {
    const url = `${API_BASE}${endpoint}`

    // 默认添加认证头
    const headers = {
        ...getAuthHeader(),
        ...options.headers
    }

    const { skipInterceptor, ...fetchOptions } = options
    const config = {
        ...fetchOptions,
        headers
    }

    try {
        const res = await fetch(url, config)

        // 拦截 401 Unauthorized
        if (res.status === 401 && !skipInterceptor) {
            localStorage.removeItem('adminToken')
            // 如果不是已经在登录页，则重定向
            if (!window.location.pathname.includes('/admin/login')) {
                window.location.href = '/admin/login'
            }
            throw new Error('Unauthorized')
        }

        return res
    } catch (error) {
        throw error
    }
}

// API 请求封装
export const api = {
    // 饰品
    async getJewelry(params = {}) {
        const query = new URLSearchParams(params).toString()
        const res = await request(`/jewelry${query ? '?' + query : ''}`)
        return res.json()
    },

    async getJewelryById(id) {
        const res = await request(`/jewelry/${id}`)
        return res.json()
    },

    async createJewelry(data) {
        const res = await request(`/jewelry`, {
            method: 'POST',
            body: JSON.stringify(data)
        })
        return res.json()
    },

    async updateJewelry(id, data) {
        const res = await request(`/jewelry/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        })
        return res.json()
    },

    async deleteJewelry(id) {
        const res = await request(`/jewelry/${id}`, {
            method: 'DELETE'
        })
        return res.json()
    },

    // 图片
    async getImages() {
        const res = await request('/images')
        return res.json()
    },

    async updateImage(id, data) {
        const res = await request(`/images/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        })
        return res.json()
    },

    async deleteImage(id) {
        const res = await request(`/images/${id}`, {
            method: 'DELETE'
        })
        return res.json()
    },

    // 页面内容
    async getPages() {
        const res = await request('/pages')
        return res.json()
    },

    async getPageContent(pageKey) {
        const res = await request(`/pages/${pageKey}`)
        return res.json()
    },

    async updatePageContent(pageKey, content) {
        const res = await request(`/pages/${pageKey}`, {
            method: 'PUT',
            body: JSON.stringify({ content: JSON.stringify(content) })
        })
        return res.json()
    },

    // 统计
    async getStats() {
        const res = await request('/admin/stats')
        return res.json()
    },

    // 访问分析
    async trackPageView(path, visitorId, referrer) {
        // 不使用认证头，公开API
        const res = await fetch(`${API_BASE}/analytics/track`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path, visitor_id: visitorId, referrer })
        })
        return res.json()
    },

    async getAnalytics() {
        const res = await request('/analytics/stats')
        return res.json()
    },

    // 认证
    async login(username, password) {
        const res = await request(`/auth/login`, {
            method: 'POST',
            body: JSON.stringify({ username, password }),
            skipInterceptor: true
        })
        if (res.ok) {
            return { ok: true, data: await res.json() }
        }
        return { ok: false, data: await res.json() }
    },

    async changePassword(oldPassword, newPassword) {
        const res = await request(`/auth/change-password`, {
            method: 'POST',
            body: JSON.stringify({ oldPassword, newPassword })
        })
        if (res.ok) {
            return { ok: true, data: await res.json() }
        }
        return { ok: false, data: await res.json() }
    },

    // 图片上传
    async uploadImages(files, jewelryId = null) {
        const formData = new FormData()
        files.forEach(file => formData.append('images', file))
        if (jewelryId) formData.append('jewelry_id', jewelryId)

        const token = localStorage.getItem('adminToken')
        // 上传单独处理，因为Content-Type由FormData控制
        const res = await fetch(`${API_BASE}/upload`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        })

        if (res.status === 401) {
            localStorage.removeItem('adminToken')
            window.location.href = '/admin/login'
            throw new Error('Unauthorized')
        }

        return res.json()
    },

    // 首页展廊图片
    async getGalleryImages(visibleOnly = true) {
        const res = await fetch(`${API_BASE}/gallery?visible=${visibleOnly}`)
        return res.json()
    },

    async getAllGalleryImages() {
        const res = await request('/gallery/all')
        return res.json()
    },

    async uploadGalleryImage(file, title = '', titleEn = '', alt = '') {
        const formData = new FormData()
        formData.append('image', file)
        formData.append('title', title)
        formData.append('title_en', titleEn)
        formData.append('alt', alt)

        const token = localStorage.getItem('adminToken')
        const res = await fetch(`${API_BASE}/gallery/upload`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        })

        if (res.status === 401) {
            localStorage.removeItem('adminToken')
            window.location.href = '/admin/login'
            throw new Error('Unauthorized')
        }

        return res.json()
    },

    async updateGalleryImage(id, data) {
        const res = await request(`/gallery/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        })
        return res.json()
    },

    async deleteGalleryImage(id) {
        const res = await request(`/gallery/${id}`, {
            method: 'DELETE'
        })
        return res.json()
    },

    async reorderGalleryImages(orderList) {
        const res = await request('/gallery/reorder', {
            method: 'POST',
            body: JSON.stringify({ order: orderList })
        })
        return res.json()
    }
}

export default api
