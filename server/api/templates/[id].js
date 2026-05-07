import { neon } from '@neondatabase/serverless'

export default async function handler(req, res) {
  const { id } = req.query
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL
  if (!connectionString) {
    return res.status(500).json({ success: false, message: 'DATABASE_URL is not configured' })
  }
  const sql = neon(connectionString)

  if (req.method === 'GET') {
    try {
      const result = await sql`SELECT id, name, headers, column_mappings, to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at FROM templates WHERE id = ${id}`
      if (result.length === 0) return res.status(404).json({ success: false, message: '模板不存在' })
      return res.status(200).json({ success: true, data: result[0] })
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message })
    }
  }

  if (req.method === 'PUT') {
    try {
      const { name, headers, columnMappings } = req.body
      const result = await sql`UPDATE templates SET name = COALESCE(${name || null}, name), headers = COALESCE(${headers || null}, headers), column_mappings = COALESCE(${columnMappings ? JSON.stringify(columnMappings) : null}, column_mappings), updated_at = CURRENT_TIMESTAMP WHERE id = ${id} RETURNING id, name, headers, column_mappings, to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at`
      if (result.length === 0) return res.status(404).json({ success: false, message: '模板不存在' })
      return res.status(200).json({ success: true, data: result[0] })
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message })
    }
  }

  if (req.method === 'DELETE') {
    try {
      const result = await sql`DELETE FROM templates WHERE id = ${id} RETURNING id`
      if (result.length === 0) return res.status(404).json({ success: false, message: '模板不存在' })
      return res.status(200).json({ success: true, message: '删除成功' })
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message })
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' })
}
