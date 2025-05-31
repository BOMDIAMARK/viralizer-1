import type { Config } from "drizzle-kit"

if (!process.env.POSTGRES_URL) {
  throw new Error("POSTGRES_URL environment variable is not set for Drizzle Kit.")
}

export default {
  schema: "./lib/db/schema.ts",
  out: "./drizzle", // Output directory for migrations
  dialect: "postgresql", // Specify PostgreSQL dialect
  dbCredentials: {
    url: process.env.POSTGRES_URL,
  },
  // Optionally, if you want to target a specific schema in your database (e.g., 'public')
  // tablesFilter: ["public_*"], // Example: only manage tables in the 'public' schema
  // verbose: true, // For more detailed output
  // strict: true, // For stricter type checking
} satisfies Config
