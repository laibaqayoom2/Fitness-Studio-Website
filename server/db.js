import { env } from './config.js'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err)
})

export default pool
