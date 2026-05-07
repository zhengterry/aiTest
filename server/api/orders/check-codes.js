import { neon } from '@neondatabase/serverless'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL
  if (!connectionString) {
    return res.status(500).json({ success: false, message: 'DATABASE_URL is not configured' })
  }
  const sql = neon(connectionString)

  try {
    const { codes } = req.body
    if (!Array.isArray(codes) || codes.length === 0) {
      return res.status(200).json({ success: true, data: [] })
    }
    const result = await sql`SELECT external_code FROM orders WHERE external_code = ANY(${codes})`
    return res.status(200).json({ success: true, data: result.map(r => r.external_code) })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}
