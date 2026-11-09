// Tipos generados desde la base de datos de Supabase (no editar a mano).
// Para regenerarlos: npx supabase gen types typescript --project-id ndidurucsppedklwvson > src/lib/database.types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      bakeries: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          logo_path: string | null
          name: string
          paid_until: string | null
          plan: Database["public"]["Enums"]["bakery_plan"]
          primary_color: string
          secondary_color: string
          slug: string
          status: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          logo_path?: string | null
          name: string
          paid_until?: string | null
          plan?: Database["public"]["Enums"]["bakery_plan"]
          primary_color?: string
          secondary_color?: string
          slug: string
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          logo_path?: string | null
          name?: string
          paid_until?: string | null
          plan?: Database["public"]["Enums"]["bakery_plan"]
          primary_color?: string
          secondary_color?: string
          slug?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      bakery_members: {
        Row: {
          active: boolean
          bakery_id: string
          created_at: string
          roles: Database["public"]["Enums"]["member_role"][]
          user_id: string
        }
        Insert: {
          active?: boolean
          bakery_id: string
          created_at?: string
          roles: Database["public"]["Enums"]["member_role"][]
          user_id: string
        }
        Update: {
          active?: boolean
          bakery_id?: string
          created_at?: string
          roles?: Database["public"]["Enums"]["member_role"][]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bakery_members_bakery_id_fkey"
            columns: ["bakery_id"]
            isOneToOne: false
            referencedRelation: "bakeries"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          bakery_id: string
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          roles: Database["public"]["Enums"]["member_role"][]
          token: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          bakery_id: string
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          roles: Database["public"]["Enums"]["member_role"][]
          token?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          bakery_id?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          roles?: Database["public"]["Enums"]["member_role"][]
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_bakery_id_fkey"
            columns: ["bakery_id"]
            isOneToOne: false
            referencedRelation: "bakeries"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_admins: {
        Row: { created_at: string; user_id: string }
        Insert: { created_at?: string; user_id: string }
        Update: { created_at?: string; user_id?: string }
        Relationships: []
      }
      profiles: {
        Row: { created_at: string; full_name: string; id: string; phone: string | null }
        Insert: { created_at?: string; full_name?: string; id: string; phone?: string | null }
        Update: { created_at?: string; full_name?: string; id?: string; phone?: string | null }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      accept_invitation: { Args: { p_token: string }; Returns: string }
      admin_list_bakeries: {
        Args: never
        Returns: {
          created_at: string
          id: string
          members_count: number
          name: string
          owner_email: string
          paid_until: string
          plan: Database["public"]["Enums"]["bakery_plan"]
          slug: string
          status: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at: string
        }[]
      }
      admin_update_subscription: {
        Args: {
          p_bakery_id: string
          p_paid_until: string
          p_plan: Database["public"]["Enums"]["bakery_plan"]
          p_status: Database["public"]["Enums"]["subscription_status"]
        }
        Returns: undefined
      }
      check_slug_available: { Args: { p_slug: string }; Returns: boolean }
      create_bakery: {
        Args: { p_name: string; p_slug: string }
        Returns: Database["public"]["Tables"]["bakeries"]["Row"]
        SetofOptions: { from: "*"; to: "bakeries"; isOneToOne: true; isSetofReturn: false }
      }
      create_invitation: {
        Args: {
          p_bakery_id: string
          p_email: string
          p_roles: Database["public"]["Enums"]["member_role"][]
        }
        Returns: string
      }
      get_invitation: {
        Args: { p_token: string }
        Returns: {
          accepted: boolean
          bakery_name: string
          email: string
          expired: boolean
          roles: Database["public"]["Enums"]["member_role"][]
        }[]
      }
      remove_member: { Args: { p_bakery_id: string; p_user_id: string }; Returns: undefined }
      update_member: {
        Args: {
          p_active: boolean
          p_bakery_id: string
          p_roles: Database["public"]["Enums"]["member_role"][]
          p_user_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      bakery_plan: "basico" | "plus"
      member_role: "owner" | "admin" | "vendedor" | "produccion"
      subscription_status: "trial" | "active" | "suspended"
    }
    CompositeTypes: { [_ in never]: never }
  }
}

export type Bakery = Database["public"]["Tables"]["bakeries"]["Row"]
export type MemberRole = Database["public"]["Enums"]["member_role"]
export type BakeryPlan = Database["public"]["Enums"]["bakery_plan"]
export type SubscriptionStatus = Database["public"]["Enums"]["subscription_status"]
