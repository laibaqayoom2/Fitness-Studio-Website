import 'dotenv/config'
import pg from 'pg'

export default new pg.Pool({ connectionString: process.env.DATABASE_URL })