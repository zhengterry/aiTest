import { getSql } from '../../db/connection.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  const sql = getSql()
  const { books } = req.body

  if (!Array.isArray(books) || books.length === 0) {
    return res.status(400).json({ success: false, message: '导入数据不能为空' })
  }

  try {
    let imported = 0
    for (const book of books) {
      if (!book.title) continue
      await sql`
        INSERT INTO books (title, author, isbn, category, price, stock, publish_date, description)
        VALUES (${book.title}, ${book.author || ''}, ${book.isbn || null}, ${book.category || null}, ${book.price || 0}, ${book.stock || 0}, ${book.publishDate || null}, ${book.description || null})
      `
      imported++
    }

    return res.status(200).json({ success: true, message: `成功导入 ${imported} 条数据` })
  } catch (err) {
    console.error('Import API error:', err)
    return res.status(500).json({ success: false, message: '导入失败：' + err.message })
  }
}
