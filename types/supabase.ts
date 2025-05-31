export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          credits: number | null
          is_premium: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          credits?: number | null
          is_premium?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          credits?: number | null
          is_premium?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      images: {
        Row: {
          id: string
          user_id: string
          prompt: string
          negative_prompt: string | null
          style: string
          model: string | null // Could be a Replicate model ID or a Fal.ai trained clone ID
          image_url: string
          thumbnail_url: string | null
          width: number | null
          height: number | null
          seed: number | null
          is_public: boolean | null
          metadata: Json | null // e.g., { "replicate_prediction_id": "...", "fal_model_id": "..." }
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          prompt: string
          negative_prompt?: string | null
          style: string
          model?: string | null
          image_url: string
          thumbnail_url?: string | null
          width?: number | null
          height?: number | null
          seed?: number | null
          is_public?: boolean | null
          metadata?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          prompt?: string
          negative_prompt?: string | null
          style?: string
          model?: string | null
          image_url?: string
          thumbnail_url?: string | null
          width?: number | null
          height?: number | null
          seed?: number | null
          is_public?: boolean | null
          metadata?: Json | null
          created_at?: string | null
        }
      }
      clones: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          status: string // e.g., pending_upload, training_queued, training_processing, training_succeeded, training_failed
          model_id: string | null // This will store the Fal.ai output model_id
          fal_train_id: string | null // ID from Fal.ai for polling training status
          sample_image_url: string | null
          training_images: string[] | null // URLs of training images stored in Supabase Storage
          trigger_word: string | null
          metadata: Json | null // Store Fal.ai config, progress, etc.
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          status?: string
          model_id?: string | null
          fal_train_id?: string | null
          sample_image_url?: string | null
          training_images?: string[] | null
          trigger_word?: string | null
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          status?: string
          model_id?: string | null
          fal_train_id?: string | null
          sample_image_url?: string | null
          training_images?: string[] | null
          trigger_word?: string | null
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      videos: {
        Row: {
          id: string
          user_id: string
          prompt: string
          video_url: string | null
          thumbnail_url: string | null
          status: string
          replicate_prediction_id: string | null
          length_seconds: number | null
          fps: number | null
          resolution: string | null
          error_message: string | null
          created_at: string
          updated_at: string
          metadata: Json | null
        }
        Insert: {
          id?: string
          user_id: string
          prompt: string
          video_url?: string | null
          thumbnail_url?: string | null
          status?: string
          replicate_prediction_id?: string | null
          length_seconds?: number | null
          fps?: number | null
          resolution?: string | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
          metadata?: Json | null
        }
        Update: {
          id?: string
          user_id?: string
          prompt?: string
          video_url?: string | null
          thumbnail_url?: string | null
          status?: string
          replicate_prediction_id?: string | null
          length_seconds?: number | null
          fps?: number | null
          resolution?: string | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
          metadata?: Json | null
        }
      }
    }
  }
}
