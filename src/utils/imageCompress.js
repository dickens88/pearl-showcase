// 在浏览器里压缩图片（替代原后端 Pillow 的处理）：
// 主图最长边 1200px、缩略图最长边 400px，优先输出 WebP，不支持时退回 JPEG。

const QUALITY = 0.85

async function loadBitmap(file) {
    try {
        // 按 EXIF 方向自动旋转
        return await createImageBitmap(file, { imageOrientation: 'from-image' })
    } catch {
        return await createImageBitmap(file)
    }
}

function canvasToBlob(canvas, type, quality) {
    return new Promise((resolve) => canvas.toBlob(resolve, type, quality))
}

async function resize(bitmap, maxSize) {
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height))
    const w = Math.max(1, Math.round(bitmap.width * scale))
    const h = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#fff' // 透明 PNG 转换时铺白底（与原 Pillow 转 RGB 一致）
    ctx.fillRect(0, 0, w, h)
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(bitmap, 0, 0, w, h)

    let blob = await canvasToBlob(canvas, 'image/webp', QUALITY)
    if (!blob || blob.type !== 'image/webp') blob = await canvasToBlob(canvas, 'image/jpeg', QUALITY)
    return blob
}

const baseName = (name) => (name || 'image').replace(/\.[^.]+$/, '')

/** 返回 { main: File, thumb: File | null }；压缩失败时原样上传原图 */
export async function compressImage(file) {
    try {
        const bitmap = await loadBitmap(file)
        const [main, thumb] = [await resize(bitmap, 1200), await resize(bitmap, 400)]
        bitmap.close?.()
        if (!main) throw new Error('compress failed')
        const ext = main.type === 'image/webp' ? 'webp' : 'jpg'
        return {
            main: new File([main], `${baseName(file.name)}.${ext}`, { type: main.type }),
            thumb: thumb ? new File([thumb], `thumb_${baseName(file.name)}.${ext}`, { type: thumb.type }) : null,
        }
    } catch (e) {
        console.warn('图片压缩失败，将上传原图：', e)
        return { main: file, thumb: null }
    }
}
