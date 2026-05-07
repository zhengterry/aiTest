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
    const { headers, mappedFields } = req.body
    if (!headers || headers.length === 0) {
      return res.status(200).json({ success: true, data: null })
    }

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

    return res.status(200).json({
      success: true,
      data: bestMatch ? {
        id: bestMatch.id,
        name: bestMatch.name,
        columnMappings: bestMatch.column_mappings,
        matchScore: bestScore
      } : null
    })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}
