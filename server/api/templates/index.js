import { neon } from '@neondatabase/serverless'

export default async function handler(req, res) {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL
  if (!connectionString) {
    return res.status(500).json({ success: false, message: 'DATABASE_URL is not configured' })
  }
  const sql = neon(connectionString)

  if (req.method === 'GET') {
    try {
      const result = await sql`SELECT id, name, headers, column_mappings, to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at, to_char(updated_at, 'YYYY-MM-DD HH24:MI:SS') as updated_at FROM templates ORDER BY id DESC`
      return res.status(200).json({ success: true, data: result })
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message })
    }
  }

  if (req.method === 'POST') {
    try {
      const { name, headers, columnMappings } = req.body
      if (!name || !headers || !columnMappings) {
        return res.status(400).json({ success: false, message: '模板名称、表头和映射关系不能为空' })
      }
      const result = await sql`INSERT INTO templates (name, headers, column_mappings) VALUES (${name}, ${headers}, ${JSON.stringify(columnMappings)}) RETURNING id, name, headers, column_mappings, to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at`
      return res.status(201).json({ success: true, data: result[0] })
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message })
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' })
}
