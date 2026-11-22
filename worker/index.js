// 安澜・拾光 API —— Cloudflare Worker 版本（替代原 Flask 后端）
// 运行环境绑定：DB (D1)、BUCKET (R2)、ASSETS (前端静态文件)
// 前台用户：/api/user/*（Token 带 role=user，不能访问后台接口）
// Secret：JWT_SECRET、ADMIN_PASSWORD（仅在首次登录、admins 表为空时用来创建 admin 账号）
import { Hono } from 'hono'
import { sign, verify } from 'hono/jwt'

const app = new Hono()

const TOKEN_TTL_SECONDS = 12 * 60 * 60
const USER_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60
const USER_MIN_PASSWORD = 8
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
const MAX_UPLOAD_BYTES = 20 * 1024 * 1024
const ALLOWED_TYPES = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png' }
const PBKDF2_ITERATIONS = 20000 // 免费版 Worker 每次请求 CPU 时间有限，不宜设得太高

// ---------- 工具函数 ----------

const now = () => new Date().toISOString()
const bool = (v) => v === 1 || v === true || v === '1' || v === 'true'
const notFound = (c) => c.json({ message: '资源不存在' }, 404)

async function readJson(c) {
  try {
    return (await c.req.json()) || {}
  } catch {
    return {}
  }
}

function imageToDict(r) {
  return {
    id: r.id,
    filename: r.filename,
    original_name: r.original_name,
    path: r.path,
    thumb_path: r.thumb_path || r.path,
    jewelry_id: r.jewelry_id,
    description: r.description,
    description_en: r.description_en,
    order_index: r.order_index,
  }
}

function jewelryToDict(r, images = []) {
  return {
    id: r.id,
    name: r.name,
    name_en: r.name_en,
    category: r.category,
    description: r.description,
    description_en: r.description_en,
    order_index: r.order_index,
    is_visible: bool(r.is_visible),
    is_featured: bool(r.is_featured),
    created_at: r.created_at,
    images: images.map(imageToDict),
  }
}

function galleryToDict(r) {
  return {
    id: r.id,
    filename: r.filename,
    original_name: r.original_name,
    path: r.path,
    thumb_path: r.thumb_path || r.path,
    title: r.title,
    title_en: r.title_en,
    alt: r.alt,
    order_index: r.order_index,
    is_visible: bool(r.is_visible),
    created_at: r.created_at,
  }
}

function pageToDict(r) {
  return { id: r.id, page_key: r.page_key, content: r.content, updated_at: r.updated_at }
}

async function attachImages(db, rows) {
  if (!rows.length) return []
  const ids = JSON.stringify(rows.map((r) => r.id))
  const { results } = await db
    .prepare(
      'SELECT * FROM images WHERE jewelry_id IN (SELECT value FROM json_each(?)) ORDER BY order_index, id'
    )
    .bind(ids)
    .all()
  const byJewelry = new Map()
  for (const img of results) {
    if (!byJewelry.has(img.jewelry_id)) byJewelry.set(img.jewelry_id, [])
    byJewelry.get(img.jewelry_id).push(img)
  }
  return rows.map((r) => jewelryToDict(r, byJewelry.get(r.id) || []))
}

// 按字段白名单拼 UPDATE 语句
function buildUpdate(data, fields, transforms = {}) {
  const sets = []
  const values = []
  for (const f of fields) {
    if (f in data) {
      sets.push(`${f} = ?`)
      values.push(transforms[f] ? transforms[f](data[f]) : data[f])
    }
  }
  return { sets, values }
}

const toIntBool = (v) => (bool(v) ? 1 : 0)

// ---------- 密码哈希（PBKDF2-SHA256，WebCrypto） ----------

const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)))
const unb64 = (s) => Uint8Array.from(atob(s), (ch) => ch.charCodeAt(0))

async function pbkdf2(password, salt, iterations) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, [
    'deriveBits',
  ])
  return crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256)
}

async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const bits = await pbkdf2(password, salt, PBKDF2_ITERATIONS)
  return `pbkdf2_sha256$${PBKDF2_ITERATIONS}$${b64(salt)}$${b64(bits)}`
}

async function verifyPassword(password, stored) {
  const parts = (stored || '').split('$')
  if (parts.length !== 4 || parts[0] !== 'pbkdf2_sha256') return false
  const iterations = parseInt(parts[1], 10)
  const expected = unb64(parts[3])
  const actual = new Uint8Array(await pbkdf2(password, unb64(parts[2]), iterations))
  if (actual.length !== expected.length) return false
  let diff = 0
  for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i]
  return diff === 0
}

// ---------- 鉴权 ----------

async function readToken(c) {
  const header = c.req.header('Authorization') || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!token) return { error: c.json({ message: '缺少认证Token' }, 401) }
  try {
    return { payload: await verify(token, c.env.JWT_SECRET, 'HS256') }
  } catch (e) {
    return { error: c.json({ message: 'Token无效或已过期，请重新登录' }, 401) }
  }
}

// 后台管理员鉴权：前台用户 Token（role=user）一律拒绝
const requireAuth = async (c, next) => {
  const { payload, error } = await readToken(c)
  if (error) return error
  if (payload.role === 'user') return c.json({ message: '无权访问' }, 403)
  c.set('adminId', parseInt(payload.sub, 10))
  await next()
}

// 前台用户鉴权：只接受 role=user 的 Token
const requireUser = async (c, next) => {
  const { payload, error } = await readToken(c)
  if (error) return error
  if (payload.role !== 'user') return c.json({ message: '无权访问' }, 403)
  const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(parseInt(payload.sub, 10)).first()
  if (!user) return c.json({ message: '用户不存在' }, 401)
  c.set('user', user)
  await next()
}

// ---------- 认证 ----------

app.post('/api/auth/login', async (c) => {
  const { username, password } = await readJson(c)
  if (!username || !password) return c.json({ message: '请输入用户名和密码' }, 400)

  const db = c.env.DB
  // 首次使用：admins 表为空时，用 ADMIN_PASSWORD secret 创建 admin 账号
  const count = await db.prepare('SELECT COUNT(*) AS n FROM admins').first('n')
  if (count === 0 && c.env.ADMIN_PASSWORD) {
    await db
      .prepare('INSERT INTO admins (username, password_hash, created_at) VALUES (?, ?, ?)')
      .bind('admin', await hashPassword(c.env.ADMIN_PASSWORD), now())
      .run()
  }

  const admin = await db.prepare('SELECT * FROM admins WHERE username = ?').bind(username).first()
  if (!admin || !(await verifyPassword(password, admin.password_hash))) {
    return c.json({ message: '用户名或密码错误' }, 401)
  }

  const iat = Math.floor(Date.now() / 1000)
  const token = await sign({ sub: String(admin.id), iat, exp: iat + TOKEN_TTL_SECONDS }, c.env.JWT_SECRET)
  return c.json({ token, user: { id: admin.id, username: admin.username } })
})

app.post('/api/auth/change-password', requireAuth, async (c) => {
  const { oldPassword, newPassword } = await readJson(c)
  if (!oldPassword || !newPassword) return c.json({ message: '请输入旧密码和新密码' }, 400)

  const admin = await c.env.DB.prepare('SELECT * FROM admins WHERE id = ?').bind(c.get('adminId')).first()
  if (!admin) return c.json({ message: '用户不存在' }, 404)
  if (!(await verifyPassword(oldPassword, admin.password_hash))) return c.json({ message: '旧密码错误' }, 400)

  await c.env.DB.prepare('UPDATE admins SET password_hash = ? WHERE id = ?')
    .bind(await hashPassword(newPassword), admin.id)
    .run()
  return c.json({ message: '密码修改成功' })
})

// ---------- 前台用户与收藏夹 ----------

function userToDict(u) {
  return {
    id: u.id,
    email: u.email,
    nickname: u.nickname || u.email.split('@')[0],
    created_at: u.created_at,
  }
}

async function issueUserToken(env, user) {
  const iat = Math.floor(Date.now() / 1000)
  return sign({ sub: String(user.id), role: 'user', iat, exp: iat + USER_TOKEN_TTL_SECONDS }, env.JWT_SECRET)
}

app.post('/api/user/register', async (c) => {
  const d = await readJson(c)
  const email = String(d.email || '').trim().toLowerCase()
  const password = String(d.password || '')
  const nickname = String(d.nickname || '').trim().slice(0, 50) || null

  if (!EMAIL_RE.test(email) || email.length > 120) return c.json({ code: 'invalid_email', message: 'Invalid email' }, 400)
  if (password.length < USER_MIN_PASSWORD) return c.json({ code: 'weak_password', message: 'Password too short' }, 400)

  const db = c.env.DB
  if (await db.prepare('SELECT id FROM users WHERE email = ?').bind(email).first()) {
    return c.json({ code: 'email_taken', message: 'Email already registered' }, 409)
  }
  const user = await db
    .prepare('INSERT INTO users (email, nickname, password_hash, created_at) VALUES (?, ?, ?, ?) RETURNING *')
    .bind(email, nickname, await hashPassword(password), now())
    .first()
  return c.json({ token: await issueUserToken(c.env, user), user: userToDict(user) }, 201)
})

app.post('/api/user/login', async (c) => {
  const d = await readJson(c)
  const email = String(d.email || '').trim().toLowerCase()
  const password = String(d.password || '')
  const user = email ? await c.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first() : null
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return c.json({ code: 'invalid_credentials', message: 'Invalid email or password' }, 401)
  }
  return c.json({ token: await issueUserToken(c.env, user), user: userToDict(user) })
})

app.get('/api/user/me', requireUser, (c) => c.json(userToDict(c.get('user'))))

// 收藏的饰品（只返回前台可见的），按收藏时间倒序
app.get('/api/user/favorites', requireUser, async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT j.* FROM favorites f JOIN jewelry j ON j.id = f.jewelry_id
     WHERE f.user_id = ? AND j.is_visible = 1
     ORDER BY f.created_at DESC, f.id DESC`
  )
    .bind(c.get('user').id)
    .all()
  return c.json(await attachImages(c.env.DB, results))
})

app.get('/api/user/favorites/ids', requireUser, async (c) => {
  const { results } = await c.env.DB.prepare('SELECT jewelry_id FROM favorites WHERE user_id = ?')
    .bind(c.get('user').id)
    .all()
  return c.json(results.map((r) => r.jewelry_id))
})

app.post('/api/user/favorites/:id{[0-9]+}', requireUser, async (c) => {
  const id = parseInt(c.req.param('id'), 10)
  const db = c.env.DB
  const item = await db.prepare('SELECT id FROM jewelry WHERE id = ? AND is_visible = 1').bind(id).first()
  if (!item) return notFound(c)
  await db
    .prepare('INSERT OR IGNORE INTO favorites (user_id, jewelry_id, created_at) VALUES (?, ?, ?)')
    .bind(c.get('user').id, id, now())
    .run()
  return c.json({ favorited: true })
})

app.delete('/api/user/favorites/:id{[0-9]+}', requireUser, async (c) => {
  await c.env.DB.prepare('DELETE FROM favorites WHERE user_id = ? AND jewelry_id = ?')
    .bind(c.get('user').id, parseInt(c.req.param('id'), 10))
    .run()
  return c.json({ favorited: false })
})

// ---------- 饰品 ----------

app.get('/api/jewelry', async (c) => {
  const q = c.req.query()
  const db = c.env.DB
  const where = []
  if ((q.all || 'false').toLowerCase() !== 'true') where.push('is_visible = 1')
  if (q.featured) where.push('is_featured = 1')
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
  const limit = parseInt(q.limit, 10) || null
  const page = parseInt(q.page, 10) || null

  if (page) {
    const perPage = limit || 10
    const total = await db.prepare(`SELECT COUNT(*) AS n FROM jewelry ${whereSql}`).first('n')
    const { results } = await db
      .prepare(`SELECT * FROM jewelry ${whereSql} ORDER BY order_index ASC, id ASC LIMIT ? OFFSET ?`)
      .bind(perPage, (page - 1) * perPage)
      .all()
    return c.json({
      items: await attachImages(db, results),
      total,
      pages: Math.ceil(total / perPage),
      page,
      per_page: perPage,
    })
  }

  const stmt = limit
    ? db.prepare(`SELECT * FROM jewelry ${whereSql} ORDER BY order_index ASC, id ASC LIMIT ?`).bind(limit)
    : db.prepare(`SELECT * FROM jewelry ${whereSql} ORDER BY order_index ASC, id ASC`)
  const { results } = await stmt.all()
  return c.json(await attachImages(db, results))
})

app.get('/api/jewelry/:id{[0-9]+}', async (c) => {
  const row = await c.env.DB.prepare('SELECT * FROM jewelry WHERE id = ?').bind(c.req.param('id')).first()
  if (!row) return notFound(c)
  const [item] = await attachImages(c.env.DB, [row])
  return c.json(item)
})

app.post('/api/jewelry', requireAuth, async (c) => {
  const d = await readJson(c)
  const ts = now()
  const row = await c.env.DB.prepare(
    `INSERT INTO jewelry (name, name_en, category, description, description_en, order_index, is_visible, is_featured, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`
  )
    .bind(
      d.name ?? '',
      d.name_en ?? '',
      d.category ?? '耳饰',
      d.description ?? '',
      d.description_en ?? '',
      d.order_index ?? 0,
      toIntBool(d.is_visible ?? true),
      toIntBool(d.is_featured ?? false),
      ts,
      ts
    )
    .first()
  return c.json(jewelryToDict(row), 201)
})

app.put('/api/jewelry/:id{[0-9]+}', requireAuth, async (c) => {
  const id = c.req.param('id')
  const db = c.env.DB
  const existing = await db.prepare('SELECT id FROM jewelry WHERE id = ?').bind(id).first()
  if (!existing) return notFound(c)

  const d = await readJson(c)
  const { sets, values } = buildUpdate(
    d,
    ['name', 'name_en', 'category', 'description', 'description_en', 'order_index', 'is_visible', 'is_featured'],
    { is_visible: toIntBool, is_featured: toIntBool }
  )
  sets.push('updated_at = ?')
  values.push(now())
  await db.prepare(`UPDATE jewelry SET ${sets.join(', ')} WHERE id = ?`).bind(...values, id).run()

  const row = await db.prepare('SELECT * FROM jewelry WHERE id = ?').bind(id).first()
  const [item] = await attachImages(db, [row])
  return c.json(item)
})

app.delete('/api/jewelry/:id{[0-9]+}', requireAuth, async (c) => {
  const id = c.req.param('id')
  const db = c.env.DB
  const existing = await db.prepare('SELECT id FROM jewelry WHERE id = ?').bind(id).first()
  if (!existing) return notFound(c)
  // 与原 SQLAlchemy 行为一致：解除图片关联，不删除图片
  await db.batch([
    db.prepare('UPDATE images SET jewelry_id = NULL WHERE jewelry_id = ?').bind(id),
    db.prepare('DELETE FROM favorites WHERE jewelry_id = ?').bind(id),
    db.prepare('DELETE FROM jewelry WHERE id = ?').bind(id),
  ])
  return c.json({ message: '删除成功' })
})

// ---------- 图片（存 R2） ----------
// 前端在浏览器里先压缩成 WebP：字段 images[] 为主图，thumbs[] 为对应缩略图（可选）

async function putUpload(env, file, prefix) {
  const ext = ALLOWED_TYPES[file.type]
  if (!ext) return null
  if (file.size > MAX_UPLOAD_BYTES) return null
  const id = crypto.randomUUID().replace(/-/g, '')
  const filename = `${prefix}${id}.${ext}`
  await env.BUCKET.put(filename, file.stream(), {
    httpMetadata: { contentType: file.type, cacheControl: 'public, max-age=31536000, immutable' },
  })
  return { filename, id }
}

async function putThumb(env, thumb, prefix, id) {
  if (!(thumb instanceof File) || !ALLOWED_TYPES[thumb.type] || thumb.size > MAX_UPLOAD_BYTES) return null
  const name = `thumb_${prefix}${id}.${ALLOWED_TYPES[thumb.type]}`
  await env.BUCKET.put(name, thumb.stream(), {
    httpMetadata: { contentType: thumb.type, cacheControl: 'public, max-age=31536000, immutable' },
  })
  return name
}

app.post('/api/upload', requireAuth, async (c) => {
  const form = await c.req.formData()
  const files = form.getAll('images').filter((f) => f instanceof File)
  const thumbs = form.getAll('thumbs')
  if (!files.length) return c.json({ message: '没有上传文件' }, 400)
  const jewelryId = form.get('jewelry_id') ? parseInt(form.get('jewelry_id'), 10) : null

  const uploaded = []
  for (let i = 0; i < files.length; i++) {
    const saved = await putUpload(c.env, files[i], '')
    if (!saved) continue
    const thumbName = await putThumb(c.env, thumbs[i], '', saved.id)
    const row = await c.env.DB.prepare(
      `INSERT INTO images (filename, original_name, path, thumb_path, jewelry_id, order_index, created_at)
       VALUES (?, ?, ?, ?, ?, 0, ?) RETURNING *`
    )
      .bind(
        saved.filename,
        files[i].name || saved.filename,
        `/uploads/${saved.filename}`,
        `/uploads/${thumbName || saved.filename}`,
        jewelryId,
        now()
      )
      .first()
    uploaded.push(imageToDict(row))
  }
  return c.json({ message: `成功上传 ${uploaded.length} 张图片`, images: uploaded }, 201)
})

app.get('/api/images', requireAuth, async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM images ORDER BY created_at DESC, id DESC').all()
  return c.json(results.map(imageToDict))
})

app.put('/api/images/:id{[0-9]+}', requireAuth, async (c) => {
  const id = c.req.param('id')
  const db = c.env.DB
  const existing = await db.prepare('SELECT id FROM images WHERE id = ?').bind(id).first()
  if (!existing) return notFound(c)
  const d = await readJson(c)
  const { sets, values } = buildUpdate(d, ['jewelry_id', 'order_index', 'description', 'description_en'], {
    jewelry_id: (v) => (v ? v : null),
  })
  if (sets.length) await db.prepare(`UPDATE images SET ${sets.join(', ')} WHERE id = ?`).bind(...values, id).run()
  return c.json(imageToDict(await db.prepare('SELECT * FROM images WHERE id = ?').bind(id).first()))
})

const keyFromPath = (p) => (p && p.startsWith('/uploads/') ? p.slice('/uploads/'.length) : null)

async function deleteObjects(env, row) {
  const keys = [...new Set([row.filename, keyFromPath(row.path), keyFromPath(row.thumb_path)].filter(Boolean))]
  if (keys.length) await env.BUCKET.delete(keys)
}

app.delete('/api/images/:id{[0-9]+}', requireAuth, async (c) => {
  const id = c.req.param('id')
  const row = await c.env.DB.prepare('SELECT * FROM images WHERE id = ?').bind(id).first()
  if (!row) return notFound(c)
  await deleteObjects(c.env, row)
  await c.env.DB.prepare('DELETE FROM images WHERE id = ?').bind(id).run()
  return c.json({ message: '删除成功' })
})

// ---------- 首页展廊 ----------

app.get('/api/gallery', async (c) => {
  const visibleOnly = (c.req.query('visible') || 'true').toLowerCase() === 'true'
  const sql = `SELECT * FROM gallery_images ${visibleOnly ? 'WHERE is_visible = 1' : ''} ORDER BY order_index, id`
  const { results } = await c.env.DB.prepare(sql).all()
  return c.json(results.map(galleryToDict))
})

app.get('/api/gallery/all', requireAuth, async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM gallery_images ORDER BY order_index, id').all()
  return c.json(results.map(galleryToDict))
})

app.post('/api/gallery/upload', requireAuth, async (c) => {
  const form = await c.req.formData()
  const file = form.get('image')
  if (!(file instanceof File)) return c.json({ message: '没有上传文件' }, 400)
  const saved = await putUpload(c.env, file, 'gallery_')
  if (!saved) return c.json({ message: '不支持的文件格式或文件过大' }, 400)
  const thumbName = await putThumb(c.env, form.get('thumb'), 'gallery_', saved.id)

  const db = c.env.DB
  const maxOrder = (await db.prepare('SELECT MAX(order_index) AS m FROM gallery_images').first('m')) || 0
  const row = await db
    .prepare(
      `INSERT INTO gallery_images (filename, original_name, path, thumb_path, title, title_en, alt, order_index, is_visible, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?) RETURNING *`
    )
    .bind(
      saved.filename,
      file.name || saved.filename,
      `/uploads/${saved.filename}`,
      `/uploads/${thumbName || saved.filename}`,
      form.get('title') || '',
      form.get('title_en') || '',
      form.get('alt') || '',
      maxOrder + 1,
      now()
    )
    .first()
  return c.json({ message: '上传成功', image: galleryToDict(row) }, 201)
})

app.put('/api/gallery/:id{[0-9]+}', requireAuth, async (c) => {
  const id = c.req.param('id')
  const db = c.env.DB
  const existing = await db.prepare('SELECT id FROM gallery_images WHERE id = ?').bind(id).first()
  if (!existing) return notFound(c)
  const d = await readJson(c)
  const { sets, values } = buildUpdate(d, ['title', 'title_en', 'alt', 'order_index', 'is_visible'], {
    is_visible: toIntBool,
  })
  if (sets.length)
    await db.prepare(`UPDATE gallery_images SET ${sets.join(', ')} WHERE id = ?`).bind(...values, id).run()
  return c.json(galleryToDict(await db.prepare('SELECT * FROM gallery_images WHERE id = ?').bind(id).first()))
})

app.delete('/api/gallery/:id{[0-9]+}', requireAuth, async (c) => {
  const id = c.req.param('id')
  const row = await c.env.DB.prepare('SELECT * FROM gallery_images WHERE id = ?').bind(id).first()
  if (!row) return notFound(c)
  await deleteObjects(c.env, row)
  await c.env.DB.prepare('DELETE FROM gallery_images WHERE id = ?').bind(id).run()
  return c.json({ message: '删除成功' })
})

app.post('/api/gallery/reorder', requireAuth, async (c) => {
  const { order = [] } = await readJson(c)
  const db = c.env.DB
  const stmts = order
    .filter((item) => item && item.id != null)
    .map((item) => db.prepare('UPDATE gallery_images SET order_index = ? WHERE id = ?').bind(item.order_index, item.id))
  if (stmts.length) await db.batch(stmts)
  return c.json({ message: '排序更新成功' })
})

// ---------- 页面内容 ----------

app.get('/api/pages', requireAuth, async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM pages').all()
  return c.json(results.map(pageToDict))
})

app.get('/api/pages/:key', async (c) => {
  const row = await c.env.DB.prepare('SELECT content FROM pages WHERE page_key = ?').bind(c.req.param('key')).first()
  if (!row || !row.content) return c.json({})
  try {
    return c.json(JSON.parse(row.content))
  } catch {
    return c.json({})
  }
})

app.put('/api/pages/:key', requireAuth, async (c) => {
  const key = c.req.param('key')
  const d = await readJson(c)
  const content = d.content ?? '{}'
  const row = await c.env.DB.prepare(
    `INSERT INTO pages (page_key, content, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(page_key) DO UPDATE SET content = excluded.content, updated_at = excluded.updated_at
     RETURNING *`
  )
    .bind(key, content, now())
    .first()
  return c.json(pageToDict(row))
})

// ---------- 统计 ----------

app.get('/api/admin/stats', requireAuth, async (c) => {
  const row = await c.env.DB.prepare(
    `SELECT (SELECT COUNT(*) FROM jewelry) AS jewelryCount,
            (SELECT COUNT(*) FROM images) AS imageCount,
            (SELECT COUNT(*) FROM jewelry WHERE is_visible = 1) AS visibleCount`
  ).first()
  return c.json(row)
})

app.post('/api/analytics/track', async (c) => {
  const d = await readJson(c)
  await c.env.DB.prepare(
    `INSERT INTO page_views (page_path, visitor_id, ip_address, user_agent, referrer, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  )
    .bind(
      String(d.path || '/').slice(0, 255),
      d.visitor_id ? String(d.visitor_id).slice(0, 100) : null,
      c.req.header('CF-Connecting-IP') || null,
      (c.req.header('User-Agent') || '').slice(0, 500),
      d.referrer ? String(d.referrer).slice(0, 500) : null,
      now()
    )
    .run()
  return c.json({ success: true })
})

app.get('/api/analytics/stats', requireAuth, async (c) => {
  const db = c.env.DB
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const day = 24 * 60 * 60 * 1000
  const weekStart = new Date(today.getTime() - ((today.getUTCDay() + 6) % 7) * day) // 周一
  const monthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1))
  const sevenDaysAgo = new Date(today.getTime() - 6 * day)

  const [summary, topPages, daily] = await db.batch([
    db
      .prepare(
        `SELECT
           SUM(CASE WHEN created_at >= ?1 THEN 1 ELSE 0 END) AS todayPV,
           COUNT(DISTINCT CASE WHEN created_at >= ?1 THEN visitor_id END) AS todayUV,
           SUM(CASE WHEN created_at >= ?2 THEN 1 ELSE 0 END) AS weekPV,
           SUM(CASE WHEN created_at >= ?3 THEN 1 ELSE 0 END) AS monthPV,
           COUNT(*) AS totalPV
         FROM page_views`
      )
      .bind(today.toISOString(), weekStart.toISOString(), monthStart.toISOString()),
    db.prepare(
      'SELECT page_path AS path, COUNT(*) AS count FROM page_views GROUP BY page_path ORDER BY count DESC LIMIT 5'
    ),
    db
      .prepare(
        'SELECT substr(created_at, 1, 10) AS d, COUNT(*) AS pv FROM page_views WHERE created_at >= ? GROUP BY d'
      )
      .bind(sevenDaysAgo.toISOString()),
  ])

  const s = summary.results[0] || {}
  const pvByDay = new Map(daily.results.map((r) => [r.d, r.pv]))
  const dailyStats = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today.getTime() - i * day).toISOString().slice(0, 10)
    dailyStats.push({ date: d.slice(5), pv: pvByDay.get(d) || 0 })
  }

  return c.json({
    todayPV: s.todayPV || 0,
    todayUV: s.todayUV || 0,
    weekPV: s.weekPV || 0,
    monthPV: s.monthPV || 0,
    totalPV: s.totalPV || 0,
    topPages: topPages.results,
    dailyStats,
  })
})

// ---------- 翻译（中文 -> 英文） ----------

app.post('/api/utils/translate', requireAuth, async (c) => {
  const { text = '' } = await readJson(c)
  if (!text) return c.json({ translatedText: '' })
  try {
    const url =
      'https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-CN&tl=en&dt=t&q=' +
      encodeURIComponent(text)
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    const translated = (data[0] || []).map((seg) => seg[0]).join('')
    return c.json({ translatedText: translated })
  } catch (e) {
    return c.json({ error: '翻译失败', details: String(e.message || e) }, 500)
  }
})

// ---------- 其他 ----------

app.get('/api/health', (c) => c.json({ status: 'ok', message: '安澜・拾光 API 服务运行中' }))

app.get('/api/placeholder/:name', (c) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500">
  <rect fill="#E8E4DF" width="400" height="500"/>
  <circle cx="200" cy="200" r="60" fill="#D4CEC6"/>
  <text x="200" y="350" text-anchor="middle" fill="#999" font-size="14">珍珠饰品</text>
</svg>`
  return c.body(svg, 200, { 'Content-Type': 'image/svg+xml' })
})

// 上传的图片：从 R2 读取
app.get('/uploads/:key{.+}', async (c) => {
  const obj = await c.env.BUCKET.get(c.req.param('key'), { onlyIf: c.req.raw.headers })
  if (!obj) return c.text('Not Found', 404)
  const headers = new Headers()
  obj.writeHttpMetadata(headers)
  headers.set('etag', obj.httpEtag)
  if (!headers.has('cache-control')) headers.set('cache-control', 'public, max-age=31536000, immutable')
  // onlyIf 条件不满足时 R2 返回不带 body 的对象
  if (!('body' in obj) || !obj.body) return new Response(null, { status: 304, headers })
  return new Response(obj.body, { headers })
})

app.all('/api/*', (c) => c.json({ message: '接口不存在' }, 404))

app.onError((err, c) => {
  console.error(err)
  return c.json({ message: '服务器错误' }, 500)
})

// 其余请求交给前端静态资源（SPA）
app.all('*', (c) => c.env.ASSETS.fetch(c.req.raw))

export default app
