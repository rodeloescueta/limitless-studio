import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './src/lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:x8C3nwpQ+Y9XurgmBIp646Z2aPcdBsIoT5FZp8+ptKY=@127.0.0.1:5432/limitless_studio'
  },
  verbose: true,
  strict: true,
})