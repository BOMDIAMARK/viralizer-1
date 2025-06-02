import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./db/schema" // Import all exports from schema.ts

const connectionString = process.env.POSTGRES_URL

if (!connectionString) {
  // Log a warning or throw an error, but be careful with throwing errors at the module level
  // as it can prevent the application from starting.
  // For deployment, it's critical this is set.
  console.error("POSTGRES_URL environment variable is not set. Drizzle client cannot be initialized.")
  // Depending on your strategy, you might throw or assign a null/mock object.
  // Throwing ensures the problem is caught early in development.
  // throw new Error("POSTGRES_URL environment variable is not set.");
}

// For Vercel Edge Functions / Serverless, `prepare: false` is recommended.
// For regular Node.js (Long-running server), you can omit `prepare: false`.
const client = connectionString ? postgres(connectionString, { prepare: false }) : null

// Declare db with a type that can be null if client is null
// The schema type will be inferred correctly by Drizzle if `schema` is passed.
export let db: PostgresJsDatabase<typeof schema> | null = null

if (client) {
  db = drizzle(client, { schema })
} else {
  console.warn("Drizzle client not initialized due to missing connection string. Database operations will fail.")
}

// Ensure `db` is exported. If client is null, db will be null.
// Code using `db` will need to handle the possibility of it being null if the connection string is missing.
// However, for a production deployment, the connection string should always be present.
