import { getSql } from '../../db/connection.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') return res.status(200).end()

  const sql = getSql()

  try {
    if (req.method === 'GET') {
      const { title, author, category } = req.query

      let result
      if (!title && !author && !category) {
        result = await sql`
          SELECT id, title, author, isbn, category, price, stock,
                 to_char(publish_date, 'YYYY-MM-DD') as publish_date, description
          FROM books ORDER BY id ASC
        `
      } else {
        const titleFilter = title ? `%${title}%` : '%'
        const authorFilter = author ? `%${author}%` : '%'
        const categoryFilter = category || '%'
        result = await sql`
          SELECT id, title, author, isbn, category, price, stock,
                 to_char(publish_date, 'YYYY-MM-DD') as publish_date, description
          FROM books
          WHERE title ILIKE ${titleFilter}
            AND author ILIKE ${authorFilter}
            AND (category ILIKE ${categoryFilter})
          ORDER BY id ASC
        `
      }

      return res.status(200).json({ success: true, data: result })
    }

    if (req.method === 'POST') {
      const { title, author, isbn, category, price, stock, publishDate, description } = req.body

      if (!title || !author) {
        return res.status(400).json({ success: false, message: '书名和作者不能为空' })
      }

      const result = await sql`
        INSERT INTO books (title, author, isbn, category, price, stock, publish_date, description)
        VALUES (${title}, ${author}, ${isbn || null}, ${category || null}, ${price || 0}, ${stock || 0}, ${publishDate || null}, ${description || null})
        RETURNING id, title, author, isbn, category, price, stock, to_char(publish_date, 'YYYY-MM-DD') as publish_date, description
      `

      return res.status(201).json({ success: true, data: result[0] })
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' })
  } catch (err) {
    console.error('Books API error:', err)
    return res.status(500).json({ success: false, message: '服务器错误' })
  }
}
