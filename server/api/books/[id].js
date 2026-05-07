import { getSql } from '../../db/connection.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') return res.status(200).end()

  const { id } = req.query
  if (!id) {
    return res.status(400).json({ success: false, message: '缺少图书ID' })
  }

  const sql = getSql()

  try {
    if (req.method === 'GET') {
      const result = await sql`
        SELECT id, title, author, isbn, category, price, stock,
               to_char(publish_date, 'YYYY-MM-DD') as publish_date, description
        FROM books WHERE id = ${id}
      `
      if (result.length === 0) {
        return res.status(404).json({ success: false, message: '图书不存在' })
      }
      return res.status(200).json({ success: true, data: result[0] })
    }

    if (req.method === 'PUT') {
      const { title, author, isbn, category, price, stock, publishDate, description } = req.body
      const result = await sql`
        UPDATE books SET
          title = COALESCE(${title || null}, title),
          author = COALESCE(${author || null}, author),
          isbn = COALESCE(${isbn || null}, isbn),
          category = COALESCE(${category || null}, category),
          price = COALESCE(${price ?? null}, price),
          stock = COALESCE(${stock ?? null}, stock),
          publish_date = COALESCE(${publishDate || null}, publish_date),
          description = COALESCE(${description || null}, description),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING id, title, author, isbn, category, price, stock, to_char(publish_date, 'YYYY-MM-DD') as publish_date, description
      `
      if (result.length === 0) {
        return res.status(404).json({ success: false, message: '图书不存在' })
      }
      return res.status(200).json({ success: true, data: result[0] })
    }

    if (req.method === 'DELETE') {
      const result = await sql`DELETE FROM books WHERE id = ${id} RETURNING id`
      if (result.length === 0) {
        return res.status(404).json({ success: false, message: '图书不存在' })
      }
      return res.status(200).json({ success: true, message: '删除成功' })
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' })
  } catch (err) {
    console.error('Book detail API error:', err)
    return res.status(500).json({ success: false, message: '服务器错误' })
  }
}
