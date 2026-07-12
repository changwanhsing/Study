import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export interface QuizWord {
  id: string;
  word: string;
  ipa: string | null;
  pos: string | null;
  correctMeaning: string;
  distractors: string[];
  examples: { en: string; zh: string | null }[];
  forms: { label: string | null; text: string }[];
}

interface WordRow {
  id: string;
  word: string;
  ipa: string | null;
  pos: string | null;
  correct_meaning: string;
  word_distractors: { option_text: string; sort_order: number }[] | null;
  word_examples: { sentence_en: string; sentence_zh: string | null; sort_order: number }[] | null;
  word_forms: { label: string | null; form_text: string; sort_order: number }[] | null;
}

export async function fetchQuizWords(
  supabase: SupabaseClient<Database>,
  deckId: string
): Promise<QuizWord[]> {
  const { data, error } = await supabase
    .from("words")
    .select(
      `id, word, ipa, pos, correct_meaning,
       word_distractors ( option_text, sort_order ),
       word_examples ( sentence_en, sentence_zh, sort_order ),
       word_forms ( label, form_text, sort_order )`
    )
    .eq("deck_id", deckId);

  if (error) throw error;

  const rows = (data ?? []) as unknown as WordRow[];

  return rows.map((row) => ({
    id: row.id,
    word: row.word,
    ipa: row.ipa,
    pos: row.pos,
    correctMeaning: row.correct_meaning,
    distractors: [...(row.word_distractors ?? [])]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((d) => d.option_text),
    examples: [...(row.word_examples ?? [])]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((e) => ({ en: e.sentence_en, zh: e.sentence_zh })),
    forms: [...(row.word_forms ?? [])]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((f) => ({ label: f.label, text: f.form_text })),
  }));
}
