export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      decks: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["decks"]["Insert"]>;
      };
      words: {
        Row: {
          id: string;
          deck_id: string;
          word: string;
          ipa: string | null;
          pos: string | null;
          correct_meaning: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          deck_id: string;
          word: string;
          ipa?: string | null;
          pos?: string | null;
          correct_meaning: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["words"]["Insert"]>;
      };
      word_distractors: {
        Row: {
          id: string;
          word_id: string;
          option_text: string;
          sort_order: number;
        };
        Insert: {
          id?: string;
          word_id: string;
          option_text: string;
          sort_order?: number;
        };
        Update: Partial<Database["public"]["Tables"]["word_distractors"]["Insert"]>;
      };
      word_examples: {
        Row: {
          id: string;
          word_id: string;
          sentence_en: string;
          sentence_zh: string | null;
          sort_order: number;
        };
        Insert: {
          id?: string;
          word_id: string;
          sentence_en: string;
          sentence_zh?: string | null;
          sort_order?: number;
        };
        Update: Partial<Database["public"]["Tables"]["word_examples"]["Insert"]>;
      };
      word_forms: {
        Row: {
          id: string;
          word_id: string;
          label: string | null;
          form_text: string;
          sort_order: number;
        };
        Insert: {
          id?: string;
          word_id: string;
          label?: string | null;
          form_text: string;
          sort_order?: number;
        };
        Update: Partial<Database["public"]["Tables"]["word_forms"]["Insert"]>;
      };
      user_word_progress: {
        Row: {
          id: string;
          user_id: string;
          word_id: string;
          box_level: number;
          ease_factor: number;
          next_review_at: string;
          last_reviewed_at: string | null;
          correct_count: number;
          wrong_count: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          word_id: string;
          box_level?: number;
          ease_factor?: number;
          next_review_at?: string;
          last_reviewed_at?: string | null;
          correct_count?: number;
          wrong_count?: number;
        };
        Update: Partial<Database["public"]["Tables"]["user_word_progress"]["Insert"]>;
      };
      import_batches: {
        Row: {
          id: string;
          deck_id: string;
          uploaded_by: string;
          file_name: string;
          status: "processing" | "completed" | "failed";
          total_rows: number;
          success_rows: number;
          error_rows: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          deck_id: string;
          uploaded_by: string;
          file_name: string;
          status?: "processing" | "completed" | "failed";
          total_rows?: number;
          success_rows?: number;
          error_rows?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["import_batches"]["Insert"]>;
      };
      import_batch_errors: {
        Row: {
          id: string;
          batch_id: string;
          row_number: number;
          error_message: string;
          raw_data: Json | null;
        };
        Insert: {
          id?: string;
          batch_id: string;
          row_number: number;
          error_message: string;
          raw_data?: Json | null;
        };
        Update: Partial<Database["public"]["Tables"]["import_batch_errors"]["Insert"]>;
      };
    };
  };
}
