import 'dotenv/config'
import pg from 'pg'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const { Client } = pg
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function init() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error('❌ DATABASE_URL 未配置，请检查 .env 文件')
    process.exit(1)
  }

  const client = new Client({ connectionString })
  await client.connect()

  console.log('📦 正在初始化数据库...')

  try {
    const schema = readFileSync(join(__dirname, '../db/schema.sql'), 'utf-8')
    await client.query(schema)
    console.log('✅ 数据表创建成功')

    const seed = readFileSync(join(__dirname, '../db/seed.sql'), 'utf-8')
    await client.query(seed)
    console.log('✅ 种子数据插入成功')

    console.log('🎉 数据库初始化完成！')
  } catch (err) {
    console.error('❌ 初始化失败:', err.message)
  } finally {
    await client.end()
  }
}

init()
