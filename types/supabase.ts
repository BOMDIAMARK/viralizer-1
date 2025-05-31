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
          model: string | null
          image_url: string
          thumbnail_url: string | null
          width: number | null
          height: number | null
          seed: number | null
          is_public: boolean | null
          metadata: Json | null
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
          status: string
          model_id: string | null
          sample_image_url: string | null
          training_images: string[] | null
          metadata: Json | null
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
          sample_image_url?: string | null
          training_images?: string[] | null
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
          sample_image_url?: string | null
          training_images?: string[] | null
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      generated_videos: {
        Row: {
          id: string
          user_id: string
          prompt: string
          model: string | null
          video_url: string
          duration: number | null
          is_public: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          prompt: string
          model?: string | null
          video_url: string
          duration?: number | null
          is_public?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          prompt?: string
          model?: string | null
          video_url?: string
          duration?: number | null
          is_public?: boolean | null
          created_at?: string | null
        }
      }
    }
  }
}
