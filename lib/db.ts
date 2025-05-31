import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./db/schema" // Import all exports from schema.ts

const connectionString = process.env.POSTGRES_URL // Your Supabase connection string

if (!connectionString) {
  throw new Error("POSTGRES_URL environment variable is not set.")
}

// For Vercel Edge Functions / Serverless
const client = postgres(connectionString, { prepare: false })

// For regular Node.js (Long-running server)
// const client = postgres(connectionString);

export const db = drizzle(client, { schema }) // Pass the schema to Drizzle

// Example usage (you'd typically do this in your server actions/api routes):
// import { db } from '@/lib/db';
// import { users } from '@/lib/db/schema';
// const allUsers = await db.select().from(users);
