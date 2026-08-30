export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_options: {
        Row: {
          is_current: boolean
          membership_open: boolean
          price_discounted_two_term: number
          price_single_term: number
          term: string
        }
        Insert: {
          is_current?: boolean
          membership_open?: boolean
          price_discounted_two_term?: number
          price_single_term?: number
          term: string
        }
        Update: {
          is_current?: boolean
          membership_open?: boolean
          price_discounted_two_term?: number
          price_single_term?: number
          term?: string
        }
        Relationships: []
      }
      event_form_fields: {
        Row: {
          created_at: string
          event_id: number
          field_type: Database["public"]["Enums"]["EventFormFieldType"]
          help_text: string | null
          id: string
          is_required: boolean
          options: Json | null
          question: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_id: number
          field_type: Database["public"]["Enums"]["EventFormFieldType"]
          help_text?: string | null
          id: string
          is_required?: boolean
          options?: Json | null
          question: string
          sort_order?: number
          updated_at: string
        }
        Update: {
          created_at?: string
          event_id?: number
          field_type?: Database["public"]["Enums"]["EventFormFieldType"]
          help_text?: string | null
          id?: string
          is_required?: boolean
          options?: Json | null
          question?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_form_fields_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events_info"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registration_field_answers: {
        Row: {
          answer_payload: Json
          created_at: string
          field_id: string
          field_question_snapshot: string
          field_type_snapshot: Database["public"]["Enums"]["EventFormFieldType"]
          id: string
          registration_id: string
        }
        Insert: {
          answer_payload: Json
          created_at?: string
          field_id: string
          field_question_snapshot: string
          field_type_snapshot: Database["public"]["Enums"]["EventFormFieldType"]
          id: string
          registration_id: string
        }
        Update: {
          answer_payload?: Json
          created_at?: string
          field_id?: string
          field_question_snapshot?: string
          field_type_snapshot?: Database["public"]["Enums"]["EventFormFieldType"]
          id?: string
          registration_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_registration_field_answers_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "event_form_fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registration_field_answers_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "event_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registration_profiles: {
        Row: {
          email: string
          first_name: string
          gender: Database["public"]["Enums"]["Gender"]
          is_alumnus: boolean
          is_student: boolean
          last_name: string
          phone_number: string
          registration_id: string
          study_program: string | null
          university_name: string
        }
        Insert: {
          email: string
          first_name: string
          gender: Database["public"]["Enums"]["Gender"]
          is_alumnus: boolean
          is_student: boolean
          last_name: string
          phone_number: string
          registration_id: string
          study_program?: string | null
          university_name: string
        }
        Update: {
          email?: string
          first_name?: string
          gender?: Database["public"]["Enums"]["Gender"]
          is_alumnus?: boolean
          is_student?: boolean
          last_name?: string
          phone_number?: string
          registration_id?: string
          study_program?: string | null
          university_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_registration_profiles_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: true
            referencedRelation: "event_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registrations: {
        Row: {
          event_id: number
          id: string
          invitation_snapshot: Database["public"]["Enums"]["Invitation"]
          payment_required: boolean
          quoted_price: number
          siblings_snapshot: Database["public"]["Enums"]["Siblings"]
          status: Database["public"]["Enums"]["EventRegistrationStatus"]
          submitted_at: string
          transaction_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          event_id: number
          id: string
          invitation_snapshot: Database["public"]["Enums"]["Invitation"]
          payment_required?: boolean
          quoted_price: number
          siblings_snapshot: Database["public"]["Enums"]["Siblings"]
          status?: Database["public"]["Enums"]["EventRegistrationStatus"]
          submitted_at?: string
          transaction_id?: string | null
          updated_at: string
          user_id?: string | null
        }
        Update: {
          event_id?: number
          id?: string
          invitation_snapshot?: Database["public"]["Enums"]["Invitation"]
          payment_required?: boolean
          quoted_price?: number
          siblings_snapshot?: Database["public"]["Enums"]["Siblings"]
          status?: Database["public"]["Enums"]["EventRegistrationStatus"]
          submitted_at?: string
          transaction_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      events_info: {
        Row: {
          address: string
          date: string
          deadline: string
          description: string | null
          end_time: string
          id: number
          invitation: Database["public"]["Enums"]["Invitation"]
          is_published: boolean
          poster: string | null
          price_alumnus: number
          price_member: number
          price_nonmember: number
          siblings: Database["public"]["Enums"]["Siblings"]
          start_time: string
          term: string
          title: string
        }
        Insert: {
          address: string
          date: string
          deadline: string
          description?: string | null
          end_time: string
          id?: number
          invitation?: Database["public"]["Enums"]["Invitation"]
          is_published?: boolean
          poster?: string | null
          price_alumnus?: number
          price_member?: number
          price_nonmember?: number
          siblings?: Database["public"]["Enums"]["Siblings"]
          start_time: string
          term: string
          title: string
        }
        Update: {
          address?: string
          date?: string
          deadline?: string
          description?: string | null
          end_time?: string
          id?: number
          invitation?: Database["public"]["Enums"]["Invitation"]
          is_published?: boolean
          poster?: string | null
          price_alumnus?: number
          price_member?: number
          price_nonmember?: number
          siblings?: Database["public"]["Enums"]["Siblings"]
          start_time?: string
          term?: string
          title?: string
        }
        Relationships: []
      }
      membership_payments: {
        Row: {
          created_at: string
          id: string
          plan: Database["public"]["Enums"]["MembershipPlan"]
          term: string
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          plan: Database["public"]["Enums"]["MembershipPlan"]
          term: string
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          plan?: Database["public"]["Enums"]["MembershipPlan"]
          term?: string
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "membership_payments_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          paid_at: string | null
          payment_status: Database["public"]["Enums"]["PaymentStatus"]
          source: Database["public"]["Enums"]["TransactionSource"]
          stripe_session_id: string | null
          term: string
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          paid_at?: string | null
          payment_status?: Database["public"]["Enums"]["PaymentStatus"]
          source: Database["public"]["Enums"]["TransactionSource"]
          stripe_session_id?: string | null
          term: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          paid_at?: string | null
          payment_status?: Database["public"]["Enums"]["PaymentStatus"]
          source?: Database["public"]["Enums"]["TransactionSource"]
          stripe_session_id?: string | null
          term?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          first_name: string
          gender: Database["public"]["Enums"]["Gender"]
          id: string
          last_name: string
          phone_number: string
          role: Database["public"]["Enums"]["Role"]
          study_program: string
          term: string
        }
        Insert: {
          created_at?: string
          first_name: string
          gender: Database["public"]["Enums"]["Gender"]
          id: string
          last_name: string
          phone_number?: string
          role?: Database["public"]["Enums"]["Role"]
          study_program: string
          term: string
        }
        Update: {
          created_at?: string
          first_name?: string
          gender?: Database["public"]["Enums"]["Gender"]
          id?: string
          last_name?: string
          phone_number?: string
          role?: Database["public"]["Enums"]["Role"]
          study_program?: string
          term?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      EventFormFieldType: "short_text" | "checkbox_multi" | "radio_single"
      EventRegistrationStatus:
        | "pending"
        | "confirmed"
        | "cancelled"
        | "waitlisted"
      Gender: "male" | "female"
      Invitation:
        | "members"
        | "non_members"
        | "alumni"
        | "all_students"
        | "non_students"
      MembershipPlan: "single_term" | "two_term"
      PaymentStatus: "unpaid" | "paid" | "refunded" | "failed"
      Role: "user" | "admin"
      Siblings: "brothers" | "sisters" | "all"
      TransactionSource: "event" | "membership" | "donation"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      EventFormFieldType: ["short_text", "checkbox_multi", "radio_single"],
      EventRegistrationStatus: [
        "pending",
        "confirmed",
        "cancelled",
        "waitlisted",
      ],
      Gender: ["male", "female"],
      Invitation: [
        "members",
        "non_members",
        "alumni",
        "all_students",
        "non_students",
      ],
      MembershipPlan: ["single_term", "two_term"],
      PaymentStatus: ["unpaid", "paid", "refunded", "failed"],
      Role: ["user", "admin"],
      Siblings: ["brothers", "sisters", "all"],
      TransactionSource: ["event", "membership", "donation"],
    },
  },
} as const
