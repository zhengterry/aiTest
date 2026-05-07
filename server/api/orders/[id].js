import { getSql } from '../../db/connection.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') return res.status(200).end()

  const { id } = req.query
  if (!id || !/^\d+$/.test(id)) {
    return res.status(400).json({ success: false, message: '无效的订单ID' })
  }

  const sql = getSql()

  try {
    if (req.method === 'GET') {
      const result = await sql`
        SELECT id, external_code, sender_name, sender_phone, sender_address,
               receiver_name, receiver_phone, receiver_address,
               weight, quantity, temp_zone, remark,
               to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at
        FROM orders WHERE id = ${id}
      `
      if (result.length === 0) return res.status(404).json({ success: false, message: '订单不存在' })
      return res.status(200).json({ success: true, data: result[0] })
    }

    if (req.method === 'PUT') {
      const body = req.body
      const fields = {}
      if (body.externalCode !== undefined) fields.external_code = body.externalCode
      if (body.senderName !== undefined) fields.sender_name = body.senderName
      if (body.senderPhone !== undefined) fields.sender_phone = body.senderPhone
      if (body.senderAddress !== undefined) fields.sender_address = body.senderAddress
      if (body.receiverName !== undefined) fields.receiver_name = body.receiverName
      if (body.receiverPhone !== undefined) fields.receiver_phone = body.receiverPhone
      if (body.receiverAddress !== undefined) fields.receiver_address = body.receiverAddress
      if (body.weight !== undefined) {
        if (body.weight <= 0) return res.status(400).json({ success: false, message: '重量必须为正数' })
        fields.weight = body.weight
      }
      if (body.quantity !== undefined) {
        if (body.quantity <= 0 || !Number.isInteger(body.quantity)) return res.status(400).json({ success: false, message: '件数必须为正整数' })
        fields.quantity = body.quantity
      }
      if (body.tempZone !== undefined) {
        if (!['常温', '冷藏', '冷冻'].includes(body.tempZone)) return res.status(400).json({ success: false, message: '温层只能为常温、冷藏、冷冻' })
        fields.temp_zone = body.tempZone
      }
      if (body.remark !== undefined) fields.remark = body.remark

      const setClauses = []
      const values = []
      let paramIdx = 1

      for (const [key, value] of Object.entries(fields)) {
        setClauses.push(`${key} = $${paramIdx}`)
        values.push(value)
      }

      if (setClauses.length === 0) {
        return res.status(400).json({ success: false, message: '没有要更新的字段' })
      }

      setClauses.push(`updated_at = CURRENT_TIMESTAMP`)
      values.push(id)

      const query = `
        UPDATE orders SET ${setClauses.join(', ')}
        WHERE id = $${paramIdx + 1}
        RETURNING id, external_code, sender_name, sender_phone, sender_address,
                  receiver_name, receiver_phone, receiver_address,
                  weight, quantity, temp_zone, remark,
                  to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at
      `

      const result = await sql(query, values)
      if (result.length === 0) return res.status(404).json({ success: false, message: '订单不存在' })
      return res.status(200).json({ success: true, data: result[0] })
    }

    if (req.method === 'DELETE') {
      const result = await sql`DELETE FROM orders WHERE id = ${id} RETURNING id`
      if (result.length === 0) return res.status(404).json({ success: false, message: '订单不存在' })
      return res.status(200).json({ success: true, message: '删除成功' })
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' })
  } catch (err) {
    console.error('Order detail API error:', err)
    return res.status(500).json({ success: false, message: '服务器错误' })
  }
}
