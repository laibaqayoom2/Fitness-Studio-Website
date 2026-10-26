import 'dotenv/config'
import { z } from 'zod'

const schema = z.object({
  DATABASE_URL: z.string().url(),
  CLIENT_ORIGIN: z.string().min(1),
  PORT: z.coerce.number().default(3000),
  SESSION_TTL_DAYS: z.coerce.number().positive().default(7),
  COOKIE_SAMESITE: z.enum(['lax','strict','none']).default('lax'),
  NODE_ENV: z.enum(['development','production','test']).default('development'),
})

export const env = schema.parse(process.env)
