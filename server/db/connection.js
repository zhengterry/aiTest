import { neon } from '@neondatabase/serverless'

export function getSql() {
  const connectionString = 'postgresql://neondb_owner:npg_8luJ7FeZTgvV@ep-dawn-wind-aqtfodbh-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
  if (!connectionString) {
    throw new Error('DATABASE_URL is not configured')
  }
  return neon(connectionString)
}
