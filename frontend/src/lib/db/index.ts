import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(process.env.DATABASE_URL!, {
  prepare: false,
  max: 10, // Pool size for development
});

export const db = drizzle(client, { schema });

// Export schema for use in other files
export * from './schema';