export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          bio: string | null
          company: string | null
          website: string | null
          website_url: string | null
          username: string | null
          location: string | null
          expertise_tags: string[]
          verification_status: string
          user_type: string
          created_at: string
          updated_at: string
          phone: string | null
          is_verified: boolean
          total_sales: number
          total_purchases: number
          rating: number
          notification_preferences: Json
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          company?: string | null
          website?: string | null
          website_url?: string | null
          username?: string | null
          location?: string | null
          expertise_tags?: string[]
          verification_status?: string
          user_type?: string
          created_at?: string
          updated_at?: string
          phone?: string | null
          is_verified?: boolean
          total_sales?: number
          total_purchases?: number
          rating?: number
          notification_preferences?: Json
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          company?: string | null
          website?: string | null
          website_url?: string | null
          username?: string | null
          location?: string | null
          expertise_tags?: string[]
          verification_status?: string
          user_type?: string
          created_at?: string
          updated_at?: string
          phone?: string | null
          is_verified?: boolean
          total_sales?: number
          total_purchases?: number
          rating?: number
          notification_preferences?: Json
        }
      }
      ideas: {
        Row: {
          id: string
          title: string
          description: string
          category: string
          price: number
          currency: string
          package_type: string
          validation_status: string
          tags: string[]
          target_market: string
          implementation_difficulty: string
          revenue_potential: string
          seller_id: string
          created_at: string
          updated_at: string
          status: string
          view_count: number
          purchase_count: number
          files: Json[]
          preview_content: string | null
        }
        Insert: {
          id?: string
          title: string
          description: string
          category: string
          price: number
          currency?: string
          package_type: string
          validation_status?: string
          tags?: string[]
          target_market: string
          implementation_difficulty: string
          revenue_potential: string
          seller_id: string
          created_at?: string
          updated_at?: string
          status?: string
          view_count?: number
          purchase_count?: number
          files?: Json[]
          preview_content?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string
          category?: string
          price?: number
          currency?: string
          package_type?: string
          validation_status?: string
          tags?: string[]
          target_market?: string
          implementation_difficulty?: string
          revenue_potential?: string
          seller_id?: string
          created_at?: string
          updated_at?: string
          status?: string
          view_count?: number
          purchase_count?: number
          files?: Json[]
          preview_content?: string | null
        }
      }
      transactions: {
        Row: {
          id: string
          buyer_id: string
          seller_id: string
          idea_id: string
          amount: number
          currency: string
          status: string
          payment_method: string
          stripe_payment_intent_id: string | null
          toss_payment_key: string | null
          commission_rate: number
          commission_amount: number
          seller_amount: number
          created_at: string
          updated_at: string
          metadata: Json
        }
        Insert: {
          id?: string
          buyer_id: string
          seller_id: string
          idea_id: string
          amount: number
          currency?: string
          status?: string
          payment_method: string
          stripe_payment_intent_id?: string | null
          toss_payment_key?: string | null
          commission_rate?: number
          commission_amount?: number
          seller_amount?: number
          created_at?: string
          updated_at?: string
          metadata?: Json
        }
        Update: {
          id?: string
          buyer_id?: string
          seller_id?: string
          idea_id?: string
          amount?: number
          currency?: string
          status?: string
          payment_method?: string
          stripe_payment_intent_id?: string | null
          toss_payment_key?: string | null
          commission_rate?: number
          commission_amount?: number
          seller_amount?: number
          created_at?: string
          updated_at?: string
          metadata?: Json
        }
      }
      reviews: {
        Row: {
          id: string
          transaction_id: string
          buyer_id: string
          seller_id: string
          idea_id: string
          rating: number
          implementation_success_rating: number
          revenue_potential_rating: number
          comment: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          transaction_id: string
          buyer_id: string
          seller_id: string
          idea_id: string
          rating: number
          implementation_success_rating: number
          revenue_potential_rating: number
          comment?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          transaction_id?: string
          buyer_id?: string
          seller_id?: string
          idea_id?: string
          rating?: number
          implementation_success_rating?: number
          revenue_potential_rating?: number
          comment?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          sender_id: string
          recipient_id: string
          idea_id: string | null
          transaction_id: string | null
          subject: string
          content: string
          read: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          recipient_id: string
          idea_id?: string | null
          transaction_id?: string | null
          subject: string
          content: string
          read?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          sender_id?: string
          recipient_id?: string
          idea_id?: string | null
          transaction_id?: string | null
          subject?: string
          content?: string
          read?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}