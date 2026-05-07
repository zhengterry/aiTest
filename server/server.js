import 'dotenv/config'
import { neon } from '@neondatabase/serverless'
import { createServer } from 'http'

const PORT = 3000

function getSql() {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL
  if (!connectionString) throw new Error('DATABASE_URL is not configured')
  return neon(connectionString)
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}) }
      catch { resolve({}) }
    })
    req.on('error', reject)
  })
}

function json(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(data))
}

async function handleRequest(req, res) {
  const url = new URL(req.url, `http://localhost:${PORT}`)
  const path = url.pathname
  const method = req.method

  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (method === 'OPTIONS') return res.writeHead(200).end()

  try {
    const body = await parseBody(req)
    const sql = getSql()

    // POST /api/auth/login
    if (path === '/api/auth/login' && method === 'POST') {
      const { username, password } = body
      if (!username || !password) return json(res, 400, { success: false, message: '请输入账号和密码' })

      try {
        const users = await sql`SELECT username, nickname, role FROM users WHERE username = ${username} AND password = ${password}`
        if (users.length === 0) return json(res, 401, { success: false, message: '账号或密码错误' })
        const user = users[0]
        const token = 'token_' + Date.now() + '_' + Math.random().toString(36).slice(2)
        return json(res, 200, { success: true, data: { token, user: { username: user.username, nickname: user.nickname, role: user.role } } })
      } catch {
        if (username === 'admin' && password === 'admin') {
          return json(res, 200, { success: true, data: { token: 'token_' + Date.now(), user: { username: 'admin', nickname: '管理员', role: 'admin' } } })
        }
        return json(res, 401, { success: false, message: '账号或密码错误' })
      }
    }

    // GET /api/books
    if (path === '/api/books' && method === 'GET') {
      const { title, author, category } = Object.fromEntries(url.searchParams)
      let result
      if (!title && !author && !category) {
        result = await sql`SELECT id, title, author, isbn, category, price, stock, to_char(publish_date, 'YYYY-MM-DD') as publish_date, description FROM books ORDER BY id ASC`
      } else {
        const titleFilter = title ? `%${title}%` : '%'
        const authorFilter = author ? `%${author}%` : '%'
        const categoryFilter = category || '%'
        result = await sql`SELECT id, title, author, isbn, category, price, stock, to_char(publish_date, 'YYYY-MM-DD') as publish_date, description FROM books WHERE title ILIKE ${titleFilter} AND author ILIKE ${authorFilter} AND (category ILIKE ${categoryFilter}) ORDER BY id ASC`
      }
      return json(res, 200, { success: true, data: result })
    }

    // POST /api/books
    if (path === '/api/books' && method === 'POST') {
      const { title, author, isbn, category, price, stock, publishDate, description } = body
      if (!title || !author) return json(res, 400, { success: false, message: '书名和作者不能为空' })
      const result = await sql`INSERT INTO books (title, author, isbn, category, price, stock, publish_date, description) VALUES (${title}, ${author}, ${isbn || null}, ${category || null}, ${price || 0}, ${stock || 0}, ${publishDate || null}, ${description || null}) RETURNING id, title, author, isbn, category, price, stock, to_char(publish_date, 'YYYY-MM-DD') as publish_date, description`
      return json(res, 201, { success: true, data: result[0] })
    }

    // /api/books/:id (必须放在 import 之前检查，但 import 路由已在上面的 if 中先匹配)
    const bookDetailMatch = path.match(/^\/api\/books\/(\d+)$/)
    if (bookDetailMatch) {
      const id = bookDetailMatch[1]

      if (method === 'GET') {
        const result = await sql`SELECT id, title, author, isbn, category, price, stock, to_char(publish_date, 'YYYY-MM-DD') as publish_date, description FROM books WHERE id = ${id}`
        if (result.length === 0) return json(res, 404, { success: false, message: '图书不存在' })
        return json(res, 200, { success: true, data: result[0] })
      }

      if (method === 'PUT') {
        const { title, author, isbn, category, price, stock, publishDate, description } = body
        const result = await sql`UPDATE books SET title = COALESCE(${title || null}, title), author = COALESCE(${author || null}, author), isbn = COALESCE(${isbn || null}, isbn), category = COALESCE(${category || null}, category), price = COALESCE(${price ?? null}, price), stock = COALESCE(${stock ?? null}, stock), publish_date = COALESCE(${publishDate || null}, publish_date), description = COALESCE(${description || null}, description), updated_at = CURRENT_TIMESTAMP WHERE id = ${id} RETURNING id, title, author, isbn, category, price, stock, to_char(publish_date, 'YYYY-MM-DD') as publish_date, description`
        if (result.length === 0) return json(res, 404, { success: false, message: '图书不存在' })
        return json(res, 200, { success: true, data: result[0] })
      }

      if (method === 'DELETE') {
        const result = await sql`DELETE FROM books WHERE id = ${id} RETURNING id`
        if (result.length === 0) return json(res, 404, { success: false, message: '图书不存在' })
        return json(res, 200, { success: true, message: '删除成功' })
      }
    }

    // POST /api/books/import (放在 :id 路由之后，因为 import 不是数字)
    if (path === '/api/books/import' && method === 'POST') {
      const { books } = body
      if (!Array.isArray(books) || books.length === 0) return json(res, 400, { success: false, message: '导入数据不能为空' })
      let imported = 0
      for (const book of books) {
        if (!book.title) continue
        await sql`INSERT INTO books (title, author, isbn, category, price, stock, publish_date, description) VALUES (${book.title}, ${book.author || ''}, ${book.isbn || null}, ${book.category || null}, ${book.price || 0}, ${book.stock || 0}, ${book.publishDate || null}, ${book.description || null})`
        imported++
      }
      return json(res, 200, { success: true, message: `成功导入 ${imported} 条数据` })
    }

    // ===== 订单 API =====

    // GET /api/orders
    if (path === '/api/orders' && method === 'GET') {
      const { senderName, receiverName, tempZone } = Object.fromEntries(url.searchParams)
      let result
      if (!senderName && !receiverName && !tempZone) {
        result = await sql`SELECT id, external_code, sender_name, sender_phone, sender_address, receiver_name, receiver_phone, receiver_address, weight, quantity, temp_zone, remark, to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at FROM orders ORDER BY id DESC`
      } else {
        const sn = senderName ? `%${senderName}%` : '%'
        const rn = receiverName ? `%${receiverName}%` : '%'
        const tz = tempZone || '%'
        result = await sql`SELECT id, external_code, sender_name, sender_phone, sender_address, receiver_name, receiver_phone, receiver_address, weight, quantity, temp_zone, remark, to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at FROM orders WHERE sender_name ILIKE ${sn} AND receiver_name ILIKE ${rn} AND (temp_zone ILIKE ${tz}) ORDER BY id DESC`
      }
      return json(res, 200, { success: true, data: result })
    }

    // POST /api/orders
    if (path === '/api/orders' && method === 'POST') {
      const { externalCode, senderName, senderPhone, senderAddress, receiverName, receiverPhone, receiverAddress, weight, quantity, tempZone, remark } = body
      if (!senderName || !senderPhone || !senderAddress || !receiverName || !receiverPhone || !receiverAddress || weight === undefined || !quantity || !tempZone) return json(res, 400, { success: false, message: '必填字段不能为空' })
      if (weight <= 0) return json(res, 400, { success: false, message: '重量必须为正数' })
      if (quantity <= 0 || !Number.isInteger(quantity)) return json(res, 400, { success: false, message: '件数必须为正整数' })
      if (!['常温', '冷藏', '冷冻'].includes(tempZone)) return json(res, 400, { success: false, message: '温层只能为常温、冷藏、冷冻' })
      if (externalCode) {
        const existing = await sql`SELECT id FROM orders WHERE external_code = ${externalCode}`
        if (existing.length > 0) return json(res, 409, { success: false, message: '外部编码已存在' })
      }
      const result = await sql`INSERT INTO orders (external_code, sender_name, sender_phone, sender_address, receiver_name, receiver_phone, receiver_address, weight, quantity, temp_zone, remark) VALUES (${externalCode || null}, ${senderName}, ${senderPhone}, ${senderAddress}, ${receiverName}, ${receiverPhone}, ${receiverAddress}, ${weight}, ${quantity}, ${tempZone}, ${remark || null}) RETURNING id, external_code, sender_name, sender_phone, sender_address, receiver_name, receiver_phone, receiver_address, weight, quantity, temp_zone, remark, to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at`
      return json(res, 201, { success: true, data: result[0] })
    }

    // /api/orders/:id
    const orderDetailMatch = path.match(/^\/api\/orders\/(\d+)$/)
    if (orderDetailMatch) {
      const id = orderDetailMatch[1]

      if (method === 'GET') {
        const result = await sql`SELECT id, external_code, sender_name, sender_phone, sender_address, receiver_name, receiver_phone, receiver_address, weight, quantity, temp_zone, remark, to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at FROM orders WHERE id = ${id}`
        if (result.length === 0) return json(res, 404, { success: false, message: '订单不存在' })
        return json(res, 200, { success: true, data: result[0] })
      }

      if (method === 'PUT') {
        const { externalCode, senderName, senderPhone, senderAddress, receiverName, receiverPhone, receiverAddress, weight, quantity, tempZone, remark } = body
        const result = await sql`UPDATE orders SET external_code = COALESCE(${externalCode || null}, external_code), sender_name = COALESCE(${senderName || null}, sender_name), sender_phone = COALESCE(${senderPhone || null}, sender_phone), sender_address = COALESCE(${senderAddress || null}, sender_address), receiver_name = COALESCE(${receiverName || null}, receiver_name), receiver_phone = COALESCE(${receiverPhone || null}, receiver_phone), receiver_address = COALESCE(${receiverAddress || null}, receiver_address), weight = COALESCE(${weight ?? null}, weight), quantity = COALESCE(${quantity ?? null}, quantity), temp_zone = COALESCE(${tempZone || null}, temp_zone), remark = COALESCE(${remark || null}, remark), updated_at = CURRENT_TIMESTAMP WHERE id = ${id} RETURNING id, external_code, sender_name, sender_phone, sender_address, receiver_name, receiver_phone, receiver_address, weight, quantity, temp_zone, remark, to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at`
        if (result.length === 0) return json(res, 404, { success: false, message: '订单不存在' })
        return json(res, 200, { success: true, data: result[0] })
      }

      if (method === 'DELETE') {
        const result = await sql`DELETE FROM orders WHERE id = ${id} RETURNING id`
        if (result.length === 0) return json(res, 404, { success: false, message: '订单不存在' })
        return json(res, 200, { success: true, message: '删除成功' })
      }
    }

    // POST /api/orders/import
    if (path === '/api/orders/import' && method === 'POST') {
      const { orders: orderList } = body
      if (!Array.isArray(orderList) || orderList.length === 0) return json(res, 400, { success: false, message: '导入数据不能为空' })
      let imported = 0, skipped = 0
      for (const o of orderList) {
        if (!o.senderName || !o.senderPhone || !o.senderAddress || !o.receiverName || !o.receiverPhone || !o.receiverAddress || !o.weight || !o.quantity || !o.tempZone) { skipped++; continue }
        if (o.externalCode) {
          const existing = await sql`SELECT id FROM orders WHERE external_code = ${o.externalCode}`
          if (existing.length > 0) { skipped++; continue }
        }
        await sql`INSERT INTO orders (external_code, sender_name, sender_phone, sender_address, receiver_name, receiver_phone, receiver_address, weight, quantity, temp_zone, remark) VALUES (${o.externalCode || null}, ${o.senderName}, ${o.senderPhone}, ${o.senderAddress}, ${o.receiverName}, ${o.receiverPhone}, ${o.receiverAddress}, ${o.weight}, ${o.quantity}, ${o.tempZone || '常温'}, ${o.remark || null})`
        imported++
      }
      return json(res, 200, { success: true, message: `成功导入 ${imported} 条数据${skipped > 0 ? '，跳过 ' + skipped + ' 条' : ''}` })
    }

    // POST /api/orders/check-codes
    if (path === '/api/orders/check-codes' && method === 'POST') {
      const { codes } = body
      if (!Array.isArray(codes) || codes.length === 0) return json(res, 200, { success: true, data: [] })
      const result = await sql`SELECT external_code FROM orders WHERE external_code = ANY(${codes})`
      return json(res, 200, { success: true, data: result.map(r => r.external_code) })
    }

    // ===== 模板 API =====

    // GET /api/templates
    if (path === '/api/templates' && method === 'GET') {
      const result = await sql`SELECT id, name, headers, column_mappings, to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at, to_char(updated_at, 'YYYY-MM-DD HH24:MI:SS') as updated_at FROM templates ORDER BY id DESC`
      return json(res, 200, { success: true, data: result })
    }

    // POST /api/templates
    if (path === '/api/templates' && method === 'POST') {
      const { name, headers, columnMappings } = body
      if (!name || !headers || !columnMappings) return json(res, 400, { success: false, message: '模板名称、表头和映射关系不能为空' })
      const result = await sql`INSERT INTO templates (name, headers, column_mappings) VALUES (${name}, ${headers}, ${JSON.stringify(columnMappings)}) RETURNING id, name, headers, column_mappings, to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at`
      return json(res, 201, { success: true, data: result[0] })
    }

    // /api/templates/:id
    const templateDetailMatch = path.match(/^\/api\/templates\/(\d+)$/)
    if (templateDetailMatch) {
      const id = templateDetailMatch[1]

      if (method === 'GET') {
        const result = await sql`SELECT id, name, headers, column_mappings, to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at FROM templates WHERE id = ${id}`
        if (result.length === 0) return json(res, 404, { success: false, message: '模板不存在' })
        return json(res, 200, { success: true, data: result[0] })
      }

      if (method === 'PUT') {
        const { name, headers, columnMappings } = body
        const result = await sql`UPDATE templates SET name = COALESCE(${name || null}, name), headers = COALESCE(${headers || null}, headers), column_mappings = COALESCE(${columnMappings ? JSON.stringify(columnMappings) : null}, column_mappings), updated_at = CURRENT_TIMESTAMP WHERE id = ${id} RETURNING id, name, headers, column_mappings, to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at`
        if (result.length === 0) return json(res, 404, { success: false, message: '模板不存在' })
        return json(res, 200, { success: true, data: result[0] })
      }

      if (method === 'DELETE') {
        const result = await sql`DELETE FROM templates WHERE id = ${id} RETURNING id`
        if (result.length === 0) return json(res, 404, { success: false, message: '模板不存在' })
        return json(res, 200, { success: true, message: '删除成功' })
      }
    }

    // POST /api/templates/match
    if (path === '/api/templates/match' && method === 'POST') {
      const { headers, mappedFields } = body
      if (!headers || headers.length === 0) return json(res, 200, { success: true, data: null })
      const allTemplates = await sql`SELECT id, name, headers, column_mappings FROM templates`
      let bestMatch = null
      let bestScore = 0

      // 提取当前文件的映射字段 key 集合
      const inputFieldKeys = mappedFields
        ? Object.values(mappedFields).filter(v => v)
        : []

      for (const t of allTemplates) {
        let score = 0

        // 优先：按字段 key 语义匹配（不同列名但映射到同一字段的也算匹配）
        const tMappings = t.column_mappings || {}
        const tFieldKeys = Object.values(tMappings).filter(v => v)

        if (inputFieldKeys.length > 0 && tFieldKeys.length > 0) {
          const overlap = inputFieldKeys.filter(k => tFieldKeys.includes(k)).length
          score = overlap / Math.max(inputFieldKeys.length, tFieldKeys.length)
        }

        // 回退：按原始表头字符串匹配
        if (score === 0) {
          const tHeaders = t.headers || []
          const headerOverlap = headers.filter(h => tHeaders.includes(h)).length
          score = headerOverlap / Math.max(headers.length, tHeaders.length)
        }

        if (score > bestScore && score >= 0.5) {
          bestScore = score
          bestMatch = t
        }
      }
      return json(res, 200, { success: true, data: bestMatch ? { id: bestMatch.id, name: bestMatch.name, columnMappings: bestMatch.column_mappings, matchScore: bestScore } : null })
    }

    return json(res, 404, { success: false, message: 'API not found' })
  } catch (err) {
    console.error('Server error:', err)
    return json(res, 500, { success: false, message: '服务器错误: ' + err.message })
  }
}

createServer(handleRequest).listen(PORT, () => {
  console.log(`🚀 API Server running at http://localhost:${PORT}`)
  console.log(`📡 API base URL: http://localhost:${PORT}/api`)
})
