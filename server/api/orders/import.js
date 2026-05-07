import { getSql } from '../../db/connection.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  const { orders } = req.body
  if (!Array.isArray(orders) || orders.length === 0) {
    return res.status(400).json({ success: false, message: '导入数据不能为空' })
  }

  const sql = getSql()
  let imported = 0
  let skipped = 0

  try {
    for (const order of orders) {
      if (!order.senderName || !order.senderPhone || !order.senderAddress ||
          !order.receiverName || !order.receiverPhone || !order.receiverAddress ||
          !order.weight || !order.quantity || !order.tempZone) {
        skipped++
        continue
      }

      // 外部编码去重
      if (order.externalCode) {
        const existing = await sql`SELECT id FROM orders WHERE external_code = ${order.externalCode}`
        if (existing.length > 0) {
          skipped++
          continue
        }
      }

      await sql`
        INSERT INTO orders (external_code, sender_name, sender_phone, sender_address,
                            receiver_name, receiver_phone, receiver_address,
                            weight, quantity, temp_zone, remark)
        VALUES (${order.externalCode || null}, ${order.senderName}, ${order.senderPhone}, ${order.senderAddress},
                ${order.receiverName}, ${order.receiverPhone}, ${order.receiverAddress},
                ${order.weight}, ${order.quantity}, ${order.tempZone || '常温'}, ${order.remark || null})
      `
      imported++
    }

    return res.status(200).json({
      success: true,
      message: `成功导入 ${imported} 条数据${skipped > 0 ? '，跳过 ' + skipped + ' 条' : ''}`
    })
  } catch (err) {
    console.error('Orders import error:', err)
    return res.status(500).json({ success: false, message: '服务器错误' })
  }
}
