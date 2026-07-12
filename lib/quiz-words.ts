import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { shuffle } from "@/lib/shuffle";

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

/**
 * Priority queue for a review session: words due for review (next_review_at
 * <= now) come first (soonest-due first), then words the user has never
 * seen, then words not yet due (soonest-upcoming first) as a last resort so
 * a session is never empty just because everything is scheduled for later.
 * Within the "due" and "new" groups, order is randomized so repeat sessions
 * don't always show the same sequence.
 */
export async function fetchQuizWordsForUser(
  supabase: SupabaseClient<Database>,
  deckId: string,
  userId: string
): Promise<QuizWord[]> {
  const words = await fetchQuizWords(supabase, deckId);
  if (words.length === 0) return words;

  const { data: progressRows, error } = await supabase
    .from("user_word_progress")
    .select("word_id, next_review_at")
    .eq("user_id", userId)
    .in(
      "word_id",
      words.map((w) => w.id)
    );

  if (error) throw error;

  const progressByWordId = new Map(
    (progressRows ?? []).map((row) => [row.word_id, row.next_review_at])
  );

  const now = Date.now();
  const due: QuizWord[] = [];
  const fresh: QuizWord[] = [];
  const later: { word: QuizWord; nextReviewAt: number }[] = [];

  for (const word of words) {
    const nextReviewAt = progressByWordId.get(word.id);
    if (!nextReviewAt) {
      fresh.push(word);
    } else if (new Date(nextReviewAt).getTime() <= now) {
      due.push(word);
    } else {
      later.push({ word, nextReviewAt: new Date(nextReviewAt).getTime() });
    }
  }

  later.sort((a, b) => a.nextReviewAt - b.nextReviewAt);

  return [...shuffle(due), ...shuffle(fresh), ...later.map((l) => l.word)];
}
