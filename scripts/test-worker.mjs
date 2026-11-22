// 用 node:sqlite 模拟 D1、内存 Map 模拟 R2，端到端测试 worker/index.js 的全部接口
// 运行：npm run test:worker（需要 Node 22.5+，内置 node:sqlite）
// 适用于本机 workerd（wrangler dev）无法启动的情况；最后的翻译用例会真实访问公网
import { DatabaseSync } from 'node:sqlite'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import app from '../worker/index.js'

const sqlite = new DatabaseSync(':memory:')
for (const f of ['0001_init.sql', '0002_users_favorites.sql']) {
  sqlite.exec(readFileSync(fileURLToPath(new URL(`../migrations/${f}`, import.meta.url)), 'utf8'))
}

class Stmt {
  constructor(sql, params = []) { this.sql = sql; this.params = params }
  bind(...p) { return new Stmt(this.sql, p) }
  _s() { return sqlite.prepare(this.sql) }
  async first(col) { const r = this._s().get(...this.params); if (!r) return null; return col ? r[col] : { ...r } }
  async all() { return { results: this._s().all(...this.params).map((r) => ({ ...r })) } }
  async run() { this._s().run(...this.params); return { success: true } }
  _batch() { const s = this._s(); return /^\s*(SELECT|WITH)/i.test(this.sql) ? { results: s.all(...this.params).map((r) => ({ ...r })) } : (s.run(...this.params), { results: [] }) }
}
const DB = { prepare: (sql) => new Stmt(sql), batch: async (stmts) => stmts.map((s) => s._batch()) }

const store = new Map()
const BUCKET = {
  async put(key, body, opts) { const buf = Buffer.from(await new Response(body).arrayBuffer()); store.set(key, { buf, meta: opts.httpMetadata }) },
  async get(key, { onlyIf } = {}) {
    const o = store.get(key); if (!o) return null
    const etag = `"${key}"`
    const base = { httpEtag: etag, writeHttpMetadata: (h) => { h.set('content-type', o.meta.contentType); h.set('cache-control', o.meta.cacheControl) } }
    if (onlyIf && onlyIf.get && onlyIf.get('if-none-match') === etag) return base
    return { ...base, body: new Blob([o.buf]).stream() }
  },
  async delete(keys) { for (const k of [].concat(keys)) store.delete(k) },
}
const ASSETS = { fetch: async (req) => new Response('<html>SPA ' + new URL(req.url).pathname + '</html>', { headers: { 'content-type': 'text/html' } }) }
const env = { DB, BUCKET, ASSETS, JWT_SECRET: 'test-secret', ADMIN_PASSWORD: 'first-pass' }

let failures = 0
const check = (name, cond, extra = '') => { console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond ? '' : '  ' + extra}`); if (!cond) failures++ }
let token = ''
async function call(method, path, body, { auth = true, headers = {}, form } = {}) {
  const h = { ...headers }
  if (auth && token) h.Authorization = `Bearer ${token}`
  let b
  if (form) b = form
  else if (body !== undefined) { h['Content-Type'] = 'application/json'; b = JSON.stringify(body) }
  const res = await app.fetch(new Request('https://alsgvip.com' + path, { method, headers: h, body: b }), env)
  const ct = res.headers.get('content-type') || ''
  const data = ct.includes('json') ? await res.json() : await res.text()
  return { status: res.status, data, res }
}
const webp = (name) => new File([new Uint8Array([82, 73, 70, 70, 1, 2, 3, 4])], name, { type: 'image/webp' })

// 健康检查 / SPA / 404
check('health', (await call('GET', '/api/health')).data.status === 'ok')
const spa = await call('GET', '/gallery')
check('SPA fallback', spa.status === 200 && spa.data.includes('SPA /gallery'))
check('unknown api 404', (await call('GET', '/api/nope')).status === 404)

// 鉴权
check('protected without token -> 401', (await call('GET', '/api/admin/stats')).status === 401)
check('bad token -> 401', (await call('GET', '/api/admin/stats', undefined, { headers: { Authorization: 'Bearer x.y.z' }, auth: false })).status === 401)
check('login wrong pass -> 401', (await call('POST', '/api/auth/login', { username: 'admin', password: 'nope' })).status === 401)
check('login missing -> 400', (await call('POST', '/api/auth/login', {})).status === 400)
let r = await call('POST', '/api/auth/login', { username: 'admin', password: 'first-pass' })
check('login ok (bootstrap admin)', r.status === 200 && r.data.token && r.data.user.username === 'admin', JSON.stringify(r.data))
token = r.data.token
check('only one admin after 2 logins', (await call('POST', '/api/auth/login', { username: 'admin', password: 'first-pass' })).status === 200 && sqlite.prepare('SELECT COUNT(*) n FROM admins').get().n === 1)

// 饰品 CRUD
r = await call('POST', '/api/jewelry', { name: '珍珠耳钉', name_en: 'Pearl Stud', is_featured: true, order_index: 2 })
check('create jewelry', r.status === 201 && r.data.is_featured === true && r.data.is_visible === true && Array.isArray(r.data.images), JSON.stringify(r.data))
const j1 = r.data.id
r = await call('POST', '/api/jewelry', { name: '隐藏项链', is_visible: false, order_index: 1 })
const j2 = r.data.id
r = await call('POST', '/api/jewelry', { name: '手链', order_index: 3 })
check('public list hides invisible', (await call('GET', '/api/jewelry', undefined, { auth: false })).data.length === 2)
check('all=true shows all', (await call('GET', '/api/jewelry?all=true')).data.length === 3)
r = await call('GET', '/api/jewelry?featured=true&limit=3', undefined, { auth: false })
check('featured filter', r.data.length === 1 && r.data[0].id === j1)
r = await call('GET', '/api/jewelry?all=true&page=1&limit=2')
check('pagination', r.data.total === 3 && r.data.pages === 2 && r.data.items.length === 2 && r.data.items[0].id === j2, JSON.stringify(r.data))
r = await call('PUT', `/api/jewelry/${j2}`, { is_visible: true, name: '项链' })
check('update jewelry', r.data.is_visible === true && r.data.name === '项链')
check('get jewelry 404', (await call('GET', '/api/jewelry/9999')).status === 404)

// 图片上传（带缩略图 + 一个空缩略图占位）
let fd = new FormData()
fd.append('images', webp('a.webp')); fd.append('thumbs', webp('thumb_a.webp'))
fd.append('images', webp('b.webp')); fd.append('thumbs', new Blob([]))
fd.append('jewelry_id', String(j1))
r = await call('POST', '/api/upload', undefined, { form: fd })
check('upload 2 images', r.status === 201 && r.data.images.length === 2, JSON.stringify(r.data))
const img1 = r.data.images[0], img2 = r.data.images[1]
check('thumb stored', img1.thumb_path.startsWith('/uploads/thumb_') && store.size === 3, `${img1.thumb_path} size=${store.size}`)
check('no thumb -> thumb_path = path', img2.thumb_path === img2.path)
fd = new FormData(); fd.append('images', new File(['x'], 'x.gif', { type: 'image/gif' }))
check('reject gif', (await call('POST', '/api/upload', undefined, { form: fd })).data.images.length === 0)
r = await call('GET', `/api/jewelry/${j1}`, undefined, { auth: false })
check('jewelry includes images', r.data.images.length === 2)

const up = await call('GET', img1.path, undefined, { auth: false })
check('serve upload from R2', up.status === 200 && up.res.headers.get('content-type') === 'image/webp')
const etag = up.res.headers.get('etag')
check('conditional 304', (await call('GET', img1.path, undefined, { auth: false, headers: { 'If-None-Match': etag } })).status === 304)
check('missing upload 404', (await call('GET', '/uploads/none.webp', undefined, { auth: false })).status === 404)

r = await call('PUT', `/api/images/${img2.id}`, { description: '说明', jewelry_id: null })
check('update image', r.data.description === '说明' && r.data.jewelry_id === null)
check('list images', (await call('GET', '/api/images')).data.length === 2)
await call('DELETE', `/api/images/${img1.id}`)
check('delete image removes R2 main+thumb', store.size === 1, `size=${store.size}`)

// 删除饰品：解除图片关联
fd = new FormData(); fd.append('images', webp('c.webp')); fd.append('jewelry_id', String(j1))
const img3 = (await call('POST', '/api/upload', undefined, { form: fd })).data.images[0]
check('delete jewelry', (await call('DELETE', `/api/jewelry/${j1}`)).status === 200)
check('image unlinked, not deleted', sqlite.prepare('SELECT jewelry_id FROM images WHERE id = ?').get(img3.id).jewelry_id === null)

// 首页展廊
fd = new FormData(); fd.append('image', webp('g1.webp')); fd.append('thumb', webp('t.webp')); fd.append('title', '标题')
const g1 = (await call('POST', '/api/gallery/upload', undefined, { form: fd })).data.image
fd = new FormData(); fd.append('image', webp('g2.webp'))
const g2 = (await call('POST', '/api/gallery/upload', undefined, { form: fd })).data.image
check('gallery upload order_index increments', g1.order_index === 1 && g2.order_index === 2 && g1.filename.startsWith('gallery_') && g1.thumb_path.includes('thumb_gallery_'))
await call('PUT', `/api/gallery/${g2.id}`, { is_visible: false })
check('gallery visible filter', (await call('GET', '/api/gallery', undefined, { auth: false })).data.length === 1)
check('gallery all', (await call('GET', '/api/gallery/all')).data.length === 2)
await call('POST', '/api/gallery/reorder', { order: [{ id: g1.id, order_index: 5 }, { id: g2.id, order_index: 0 }] })
check('gallery reorder', (await call('GET', '/api/gallery/all')).data[0].id === g2.id)
await call('DELETE', `/api/gallery/${g1.id}`)
check('gallery delete', (await call('GET', '/api/gallery/all')).data.length === 1)

// 页面内容
check('default page empty', JSON.stringify((await call('GET', '/api/pages/home', undefined, { auth: false })).data) === '{}')
r = await call('PUT', '/api/pages/home', { content: JSON.stringify({ heroTitle: '你好' }) })
check('update page', r.data.page_key === 'home')
check('read page', (await call('GET', '/api/pages/home', undefined, { auth: false })).data.heroTitle === '你好')
await call('PUT', '/api/pages/newpage', { content: '{"a":1}' })
check('list pages (upsert new)', (await call('GET', '/api/pages')).data.length === 4)

// 统计
await call('POST', '/api/analytics/track', { path: '/', visitor_id: 'v1' }, { auth: false })
await call('POST', '/api/analytics/track', { path: '/', visitor_id: 'v2' }, { auth: false })
await call('POST', '/api/analytics/track', { path: '/gallery', visitor_id: 'v1' }, { auth: false })
r = await call('GET', '/api/analytics/stats')
check('analytics stats', r.data.todayPV === 3 && r.data.todayUV === 2 && r.data.totalPV === 3 && r.data.topPages[0].path === '/' && r.data.dailyStats.length === 7 && r.data.dailyStats[6].pv === 3, JSON.stringify(r.data))
r = await call('GET', '/api/admin/stats')
check('admin stats', r.data.jewelryCount === 2 && r.data.imageCount === 2 && r.data.visibleCount === 2, JSON.stringify(r.data))

// 其他
check('placeholder svg', (await call('GET', '/api/placeholder/x', undefined, { auth: false })).data.includes('<svg'))

// 修改密码
check('change pw wrong old', (await call('POST', '/api/auth/change-password', { oldPassword: 'bad', newPassword: 'n' })).status === 400)
check('change pw ok', (await call('POST', '/api/auth/change-password', { oldPassword: 'first-pass', newPassword: 'second-pass' })).status === 200)
check('old pw rejected', (await call('POST', '/api/auth/login', { username: 'admin', password: 'first-pass' })).status === 401)
check('new pw works', (await call('POST', '/api/auth/login', { username: 'admin', password: 'second-pass' })).status === 200)

// 前台用户与收藏夹
{
  const adminToken = token
  const u = (method, path, body, t) => call(method, path, body, { auth: false, headers: t ? { Authorization: `Bearer ${t}` } : {} })
  check('register bad email', (await u('POST', '/api/user/register', { email: 'nope', password: 'longpassword' })).data.code === 'invalid_email')
  check('register weak pw', (await u('POST', '/api/user/register', { email: 'a@b.com', password: 'short' })).data.code === 'weak_password')
  r = await u('POST', '/api/user/register', { email: ' A@B.com ', password: 'longpassword', nickname: '小珠' })
  check('register ok', r.status === 201 && r.data.token && r.data.user.email === 'a@b.com' && r.data.user.nickname === '小珠', JSON.stringify(r.data))
  check('register duplicate -> 409', (await u('POST', '/api/user/register', { email: 'a@b.com', password: 'longpassword' })).status === 409)
  check('user login wrong pw -> 401', (await u('POST', '/api/user/login', { email: 'a@b.com', password: 'wrongpass1' })).status === 401)
  r = await u('POST', '/api/user/login', { email: 'a@b.com', password: 'longpassword' })
  check('user login ok', r.status === 200 && r.data.token)
  const ut = r.data.token
  check('me', (await u('GET', '/api/user/me', undefined, ut)).data.email === 'a@b.com')
  check('me without token -> 401', (await u('GET', '/api/user/me')).status === 401)

  // 权限隔离
  check('user token -> admin stats 403', (await u('GET', '/api/admin/stats', undefined, ut)).status === 403)
  check('user token -> create jewelry 403', (await u('POST', '/api/jewelry', { name: 'x' }, ut)).status === 403)
  check('admin token -> user me 403', (await u('GET', '/api/user/me', undefined, adminToken)).status === 403)

  // 收藏
  const visible = (await u('GET', '/api/jewelry')).data
  const fid = visible[0].id
  check('fav add', (await u('POST', `/api/user/favorites/${fid}`, undefined, ut)).data.favorited === true)
  check('fav add twice is idempotent', (await u('POST', `/api/user/favorites/${fid}`, undefined, ut)).status === 200)
  const hidden = (await u('POST', '/api/jewelry', { name: '隐藏款', is_visible: false }, adminToken)).data.id
  check('fav hidden item -> 404', (await u('POST', `/api/user/favorites/${hidden}`, undefined, ut)).status === 404)
  check('fav missing item -> 404', (await u('POST', '/api/user/favorites/99999', undefined, ut)).status === 404)
  check('fav ids', JSON.stringify((await u('GET', '/api/user/favorites/ids', undefined, ut)).data) === JSON.stringify([fid]))
  r = await u('GET', '/api/user/favorites', undefined, ut)
  check('fav list with images', r.data.length === 1 && r.data[0].id === fid && Array.isArray(r.data[0].images), JSON.stringify(r.data))
  check('fav remove', (await u('DELETE', `/api/user/favorites/${fid}`, undefined, ut)).data.favorited === false)
  check('fav list empty', (await u('GET', '/api/user/favorites', undefined, ut)).data.length === 0)

  // 删除饰品时清理收藏
  await u('POST', `/api/user/favorites/${fid}`, undefined, ut)
  check('admin delete favorited jewelry', (await u('DELETE', `/api/jewelry/${fid}`, undefined, adminToken)).status === 200)
  check('favorite removed with jewelry', sqlite.prepare('SELECT COUNT(*) n FROM favorites').get().n === 0)
  token = adminToken
}

// 翻译（走公网）
r = await call('POST', '/api/utils/translate', { text: '珍珠耳环' })
console.log(`INFO  translate -> ${r.status} ${JSON.stringify(r.data)}`)

console.log(failures ? `\n${failures} FAILED` : '\nALL PASSED')
process.exit(failures ? 1 : 0)
