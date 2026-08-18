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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          created_at: string
          detail: Json | null
          goal_id: string | null
          id: string
          kind: string
          minutes: number
          user_id: string
        }
        Insert: {
          created_at?: string
          detail?: Json | null
          goal_id?: string | null
          id?: string
          kind: string
          minutes?: number
          user_id: string
        }
        Update: {
          created_at?: string
          detail?: Json | null
          goal_id?: string | null
          id?: string
          kind?: string
          minutes?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "learning_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      answers: {
        Row: {
          correct: boolean | null
          created_at: string
          feedback: string | null
          id: string
          question_id: string
          response: string | null
          score: number | null
          user_id: string
        }
        Insert: {
          correct?: boolean | null
          created_at?: string
          feedback?: string | null
          id?: string
          question_id: string
          response?: string | null
          score?: number | null
          user_id: string
        }
        Update: {
          correct?: boolean | null
          created_at?: string
          feedback?: string | null
          id?: string
          question_id?: string
          response?: string | null
          score?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          completed_at: string | null
          concepts: string[]
          created_at: string
          goal_id: string
          id: string
          kind: string
          module_id: string | null
          score: number | null
          session_id: string | null
          status: string
          summary_feedback: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          concepts?: string[]
          created_at?: string
          goal_id: string
          id?: string
          kind?: string
          module_id?: string | null
          score?: number | null
          session_id?: string | null
          status?: string
          summary_feedback?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          concepts?: string[]
          created_at?: string
          goal_id?: string
          id?: string
          kind?: string
          module_id?: string | null
          score?: number | null
          session_id?: string | null
          status?: string
          summary_feedback?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessments_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "learning_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "learning_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      bookmarks: {
        Row: {
          created_at: string
          id: string
          resource_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          resource_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          resource_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      concept_mastery: {
        Row: {
          application: number
          assessment_score: number
          attempts: number
          concept: string
          confidence: number
          created_at: string
          exposure: number
          goal_id: string
          id: string
          last_reviewed_at: string | null
          mastery: number
          module_id: string | null
          practice: number
          recall: number
          updated_at: string
          user_id: string
        }
        Insert: {
          application?: number
          assessment_score?: number
          attempts?: number
          concept: string
          confidence?: number
          created_at?: string
          exposure?: number
          goal_id: string
          id?: string
          last_reviewed_at?: string | null
          mastery?: number
          module_id?: string | null
          practice?: number
          recall?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          application?: number
          assessment_score?: number
          attempts?: number
          concept?: string
          confidence?: number
          created_at?: string
          exposure?: number
          goal_id?: string
          id?: string
          last_reviewed_at?: string | null
          mastery?: number
          module_id?: string | null
          practice?: number
          recall?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "concept_mastery_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "learning_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concept_mastery_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_nodes: {
        Row: {
          created_at: string
          goal_id: string | null
          id: string
          kind: string
          parent_id: string | null
          sort_order: number
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          goal_id?: string | null
          id?: string
          kind?: string
          parent_id?: string | null
          sort_order?: number
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          goal_id?: string | null
          id?: string
          kind?: string
          parent_id?: string | null
          sort_order?: number
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_nodes_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "learning_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_nodes_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "knowledge_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_goals: {
        Row: {
          blueprint: Json | null
          budget: string
          created_at: string
          current_level: string | null
          days_per_week: number
          deadline: string | null
          description: string | null
          desired_outcome: string | null
          estimated_completion_date: string | null
          estimated_total_hours: number
          generation_state: string
          id: string
          mastery_score: number
          minutes_per_day: number
          preferred_formats: string[]
          raw_input: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          blueprint?: Json | null
          budget?: string
          created_at?: string
          current_level?: string | null
          days_per_week?: number
          deadline?: string | null
          description?: string | null
          desired_outcome?: string | null
          estimated_completion_date?: string | null
          estimated_total_hours?: number
          generation_state?: string
          id?: string
          mastery_score?: number
          minutes_per_day?: number
          preferred_formats?: string[]
          raw_input?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          blueprint?: Json | null
          budget?: string
          created_at?: string
          current_level?: string | null
          days_per_week?: number
          deadline?: string | null
          description?: string | null
          desired_outcome?: string | null
          estimated_completion_date?: string | null
          estimated_total_hours?: number
          generation_state?: string
          id?: string
          mastery_score?: number
          minutes_per_day?: number
          preferred_formats?: string[]
          raw_input?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      learning_sessions: {
        Row: {
          actual_minutes: number
          completed_at: string | null
          confidence: number | null
          created_at: string
          goal_id: string
          id: string
          module_id: string | null
          notes: string | null
          objective: string | null
          plan: Json
          planned_minutes: number
          session_date: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_minutes?: number
          completed_at?: string | null
          confidence?: number | null
          created_at?: string
          goal_id: string
          id?: string
          module_id?: string | null
          notes?: string | null
          objective?: string | null
          plan?: Json
          planned_minutes?: number
          session_date?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_minutes?: number
          completed_at?: string | null
          confidence?: number | null
          created_at?: string
          goal_id?: string
          id?: string
          module_id?: string | null
          notes?: string | null
          objective?: string | null
          plan?: Json
          planned_minutes?: number
          session_date?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_sessions_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "learning_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_sessions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      module_resources: {
        Row: {
          completed: boolean
          coverage: number | null
          created_at: string
          id: string
          module_id: string
          reason: string | null
          resource_id: string
          sort_order: number
          user_id: string
        }
        Insert: {
          completed?: boolean
          coverage?: number | null
          created_at?: string
          id?: string
          module_id: string
          reason?: string | null
          resource_id: string
          sort_order?: number
          user_id: string
        }
        Update: {
          completed?: boolean
          coverage?: number | null
          created_at?: string
          id?: string
          module_id?: string
          reason?: string | null
          resource_id?: string
          sort_order?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_resources_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "module_resources_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          concepts: string[]
          created_at: string
          estimated_minutes: number
          goal_id: string
          id: string
          importance: string
          mastery: number
          objective: string | null
          skill_id: string | null
          sort_order: number
          status: string
          title: string
          updated_at: string
          user_id: string
          week_number: number
        }
        Insert: {
          concepts?: string[]
          created_at?: string
          estimated_minutes?: number
          goal_id: string
          id?: string
          importance?: string
          mastery?: number
          objective?: string | null
          skill_id?: string | null
          sort_order?: number
          status?: string
          title: string
          updated_at?: string
          user_id: string
          week_number?: number
        }
        Update: {
          concepts?: string[]
          created_at?: string
          estimated_minutes?: number
          goal_id?: string
          id?: string
          importance?: string
          mastery?: number
          objective?: string | null
          skill_id?: string | null
          sort_order?: number
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "modules_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "learning_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "modules_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          common_mistakes: string[]
          concept: string
          confidence: number | null
          created_at: string
          examples: string[]
          explanation: string | null
          goal_id: string | null
          id: string
          key_points: string[]
          node_id: string | null
          related_concepts: string[]
          revision_count: number
          source_links: string[]
          updated_at: string
          user_id: string
          user_notes: string | null
        }
        Insert: {
          common_mistakes?: string[]
          concept: string
          confidence?: number | null
          created_at?: string
          examples?: string[]
          explanation?: string | null
          goal_id?: string | null
          id?: string
          key_points?: string[]
          node_id?: string | null
          related_concepts?: string[]
          revision_count?: number
          source_links?: string[]
          updated_at?: string
          user_id: string
          user_notes?: string | null
        }
        Update: {
          common_mistakes?: string[]
          concept?: string
          confidence?: number | null
          created_at?: string
          examples?: string[]
          explanation?: string | null
          goal_id?: string | null
          id?: string
          key_points?: string[]
          node_id?: string | null
          related_concepts?: string[]
          revision_count?: number
          source_links?: string[]
          updated_at?: string
          user_id?: string
          user_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notes_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "learning_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "knowledge_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          onboarded: boolean
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          onboarded?: boolean
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          onboarded?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          brief: string | null
          created_at: string
          difficulty: string
          estimated_minutes: number
          feedback: string | null
          goal_id: string
          id: string
          requirements: string[]
          skills_practiced: string[]
          status: string
          submission: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          brief?: string | null
          created_at?: string
          difficulty?: string
          estimated_minutes?: number
          feedback?: string | null
          goal_id: string
          id?: string
          requirements?: string[]
          skills_practiced?: string[]
          status?: string
          submission?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          brief?: string | null
          created_at?: string
          difficulty?: string
          estimated_minutes?: number
          feedback?: string | null
          goal_id?: string
          id?: string
          requirements?: string[]
          skills_practiced?: string[]
          status?: string
          submission?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "learning_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          assessment_id: string
          concept: string | null
          correct_answer: string | null
          created_at: string
          id: string
          options: string[] | null
          prompt: string
          question_type: string
          rubric: string | null
          sort_order: number
          user_id: string
        }
        Insert: {
          assessment_id: string
          concept?: string | null
          correct_answer?: string | null
          created_at?: string
          id?: string
          options?: string[] | null
          prompt: string
          question_type?: string
          rubric?: string | null
          sort_order?: number
          user_id: string
        }
        Update: {
          assessment_id?: string
          concept?: string | null
          correct_answer?: string | null
          created_at?: string
          id?: string
          options?: string[] | null
          prompt?: string
          question_type?: string
          rubric?: string | null
          sort_order?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          author: string | null
          beginner_friendliness: number
          description: string | null
          difficulty: string
          discovered_at: string
          duration_minutes: number | null
          hands_on_score: number
          id: string
          price: string
          provider: string | null
          quality_score: number
          recency_score: number
          relevance_score: number
          resource_type: string
          source: string | null
          source_metadata: Json | null
          title: string
          topics: string[]
          url: string
          verified: boolean
        }
        Insert: {
          author?: string | null
          beginner_friendliness?: number
          description?: string | null
          difficulty?: string
          discovered_at?: string
          duration_minutes?: number | null
          hands_on_score?: number
          id?: string
          price?: string
          provider?: string | null
          quality_score?: number
          recency_score?: number
          relevance_score?: number
          resource_type?: string
          source?: string | null
          source_metadata?: Json | null
          title: string
          topics?: string[]
          url: string
          verified?: boolean
        }
        Update: {
          author?: string | null
          beginner_friendliness?: number
          description?: string | null
          difficulty?: string
          discovered_at?: string
          duration_minutes?: number | null
          hands_on_score?: number
          id?: string
          price?: string
          provider?: string | null
          quality_score?: number
          recency_score?: number
          relevance_score?: number
          resource_type?: string
          source?: string | null
          source_metadata?: Json | null
          title?: string
          topics?: string[]
          url?: string
          verified?: boolean
        }
        Relationships: []
      }
      skill_dependencies: {
        Row: {
          created_at: string
          id: string
          prerequisite_id: string
          skill_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          prerequisite_id: string
          skill_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          prerequisite_id?: string
          skill_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_dependencies_prerequisite_id_fkey"
            columns: ["prerequisite_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_dependencies_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          created_at: string
          estimated_minutes: number
          goal_id: string
          id: string
          importance: string
          mastery: number
          name: string
          parent_id: string | null
          sort_order: number
          summary: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          estimated_minutes?: number
          goal_id: string
          id?: string
          importance?: string
          mastery?: number
          name: string
          parent_id?: string | null
          sort_order?: number
          summary?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          estimated_minutes?: number
          goal_id?: string
          id?: string
          importance?: string
          mastery?: number
          name?: string
          parent_id?: string | null
          sort_order?: number
          summary?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skills_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "learning_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skills_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
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
    Enums: {},
  },
} as const
