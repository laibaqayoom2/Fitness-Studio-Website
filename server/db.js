import 'dotenv/config'
import pg from 'pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })

// Idle clients can lose their connection (database restart, network blip).
// Without a listener, pg's pool emits an unhandled error and the process exits.
pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err.message)
})

export default pool