import { getSql } from '../../db/connection.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') return res.status(200).end()

  const sql = getSql()

  try {
    if (req.method === 'GET') {
      const { senderName, receiverName, tempZone } = req.query

      let result
      if (!senderName && !receiverName && !tempZone) {
        result = await sql`
          SELECT id, external_code, sender_name, sender_phone, sender_address,
                 receiver_name, receiver_phone, receiver_address,
                 weight, quantity, temp_zone, remark,
                 to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at
          FROM orders ORDER BY id DESC
        `
      } else {
        const sn = senderName ? `%${senderName}%` : '%'
        const rn = receiverName ? `%${receiverName}%` : '%'
        const tz = tempZone || '%'
        result = await sql`
          SELECT id, external_code, sender_name, sender_phone, sender_address,
                 receiver_name, receiver_phone, receiver_address,
                 weight, quantity, temp_zone, remark,
                 to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at
          FROM orders
          WHERE sender_name ILIKE ${sn}
            AND receiver_name ILIKE ${rn}
            AND (temp_zone ILIKE ${tz})
          ORDER BY id DESC
        `
      }

      return res.status(200).json({ success: true, data: result })
    }

    if (req.method === 'POST') {
      const { externalCode, senderName, senderPhone, senderAddress,
              receiverName, receiverPhone, receiverAddress,
              weight, quantity, tempZone, remark } = req.body

      if (!senderName || !senderPhone || !senderAddress ||
          !receiverName || !receiverPhone || !receiverAddress ||
          weight === undefined || !quantity || !tempZone) {
        return res.status(400).json({ success: false, message: '必填字段不能为空' })
      }

      if (weight <= 0) return res.status(400).json({ success: false, message: '重量必须为正数' })
      if (quantity <= 0 || !Number.isInteger(quantity)) return res.status(400).json({ success: false, message: '件数必须为正整数' })
      if (!['常温', '冷藏', '冷冻'].includes(tempZone)) return res.status(400).json({ success: false, message: '温层只能为常温、冷藏、冷冻' })

      // 外部编码去重
      if (externalCode) {
        const existing = await sql`SELECT id FROM orders WHERE external_code = ${externalCode}`
        if (existing.length > 0) {
          return res.status(409).json({ success: false, message: '外部编码已存在' })
        }
      }

      const result = await sql`
        INSERT INTO orders (external_code, sender_name, sender_phone, sender_address,
                            receiver_name, receiver_phone, receiver_address,
                            weight, quantity, temp_zone, remark)
        VALUES (${externalCode || null}, ${senderName}, ${senderPhone}, ${senderAddress},
                ${receiverName}, ${receiverPhone}, ${receiverAddress},
                ${weight}, ${quantity}, ${tempZone}, ${remark || null})
        RETURNING id, external_code, sender_name, sender_phone, sender_address,
                  receiver_name, receiver_phone, receiver_address,
                  weight, quantity, temp_zone, remark,
                  to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at
      `

      return res.status(201).json({ success: true, data: result[0] })
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' })
  } catch (err) {
    console.error('Orders API error:', err)
    return res.status(500).json({ success: false, message: '服务器错误' })
  }
}
