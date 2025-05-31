import { pgTable, uuid, text, varchar, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

// Profiles Table (corresponds to Supabase auth.users and your public.profiles)
export const users = pgTable("users", {
  // This 'id' column should map to the Supabase auth.users.id
  id: uuid("id")
    .primaryKey()
    .references(() => authUsers.id, { onDelete: "cascade" }), // Assuming you have an authUsers table for Supabase auth
  username: varchar("username", { length: 255 }).unique(),
  full_name: varchar("full_name", { length: 255 }),
  avatar_url: text("avatar_url"),
  credits: integer("credits").default(10), // Default credits
  is_premium: boolean("is_premium").default(false),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  // Supabase specific columns often found in profiles, ensure these match your actual public.profiles table
  // If your public.profiles table's PK is 'id' and it's a FK to auth.users.id, this is correct.
})

// This is a representation of Supabase's internal auth.users table,
// needed if you want to set up foreign key relationships to it from your public tables.
// You generally don't manage this table directly with Drizzle for data insertion,
// but it's useful for schema integrity.
export const authUsers = pgTable(
  "users",
  {
    id: uuid("id").primaryKey(),
    // ... other columns from auth.users you might want to reference, e.g., email
    // Be careful: this schema is in the 'auth' schema in Supabase, not 'public'.
    // Drizzle needs to be configured to see this if you want true FKs.
    // For simplicity, we might omit direct FK to auth.users if it complicates setup,
    // and rely on Supabase's built-in FK from profiles.id to auth.users.id.
    // Let's assume users.id above is the primary key of your public.profiles table
    // and it's populated with the auth.users.id value.
  },
  (table) => {
    return { schema: "auth" } // Specify the schema for this table
  },
)

export const images = pgTable("images", {
  id: uuid("id").primaryKey().defaultRandom(), // Or text if nanoid is preferred and managed by app
  user_id: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }), // FK to your public.users (profiles) table
  prompt: text("prompt").notNull(),
  negative_prompt: text("negative_prompt"),
  style: varchar("style", { length: 255 }).notNull(),
  model: text("model"), // Could be Replicate model ID or a Fal.ai trained clone ID
  image_url: text("image_url").notNull(),
  thumbnail_url: text("thumbnail_url"),
  width: integer("width"),
  height: integer("height"),
  seed: integer("seed"), // Drizzle uses integer for numeric types, bigint for larger ones
  is_public: boolean("is_public").default(true),
  metadata: jsonb("metadata"), // e.g., { "replicate_prediction_id": "...", "fal_model_id": "..." }
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  // Removed url column as image_url seems to be its replacement
})

export const clones = pgTable("clones", {
  id: uuid("id").primaryKey().defaultRandom(), // Or text for nanoid
  user_id: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }).default("pending_upload"), // e.g., pending_upload, training_queued, training_processing, training_succeeded, training_failed
  model_id: text("model_id"), // This will store the Fal.ai output model_id or LoRA .zip URL
  fal_train_id: text("fal_train_id"), // ID from Fal.ai for polling training status or Fal client request_id
  sample_image_url: text("sample_image_url"),
  training_images: jsonb("training_images"), // URLs of training images (array of strings)
  trigger_word: varchar("trigger_word", { length: 100 }),
  metadata: jsonb("metadata"), // Store Fal.ai config, progress, etc.
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
})

export const videos = pgTable("videos", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  prompt: text("prompt").notNull(),
  video_url: text("video_url"),
  thumbnail_url: text("thumbnail_url"),
  status: varchar("status", { length: 50 }).default("pending"),
  replicate_prediction_id: text("replicate_prediction_id"),
  length_seconds: integer("length_seconds"),
  fps: integer("fps"),
  resolution: varchar("resolution", { length: 50 }),
  error_message: text("error_message"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  metadata: jsonb("metadata"),
})

// --- Relations ---
// (Optional but highly recommended for type safety and query building)

export const usersRelations = relations(users, ({ many }) => ({
  images: many(images),
  clones: many(clones),
  videos: many(videos),
}))

export const imagesRelations = relations(images, ({ one }) => ({
  user: one(users, {
    fields: [images.user_id],
    references: [users.id],
  }),
}))

export const clonesRelations = relations(clones, ({ one }) => ({
  user: one(users, {
    fields: [clones.user_id],
    references: [users.id],
  }),
}))

export const videosRelations = relations(videos, ({ one }) => ({
  user: one(videos, {
    fields: [videos.user_id],
    references: [users.id],
  }),
}))
