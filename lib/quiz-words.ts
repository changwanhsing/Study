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

const FETCH_PAGE_SIZE = 1000;

export async function fetchQuizWords(
  supabase: SupabaseClient<Database>,
  deckId: string
): Promise<QuizWord[]> {
  // Supabase/PostgREST caps rows returned per request (default 1000) unless
  // paginated with `.range()` — decks with more words than that would
  // otherwise be silently truncated.
  const rows: WordRow[] = [];
  let from = 0;

  for (;;) {
    const { data, error } = await supabase
      .from("words")
      .select(
        `id, word, ipa, pos, correct_meaning,
         word_distractors ( option_text, sort_order ),
         word_examples ( sentence_en, sentence_zh, sort_order ),
         word_forms ( label, form_text, sort_order )`
      )
      .eq("deck_id", deckId)
      .order("id", { ascending: true })
      .range(from, from + FETCH_PAGE_SIZE - 1);

    if (error) throw error;

    const page = (data ?? []) as unknown as WordRow[];
    rows.push(...page);

    if (page.length < FETCH_PAGE_SIZE) break;
    from += FETCH_PAGE_SIZE;
  }

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

  const wordIdSet = new Set(words.map((w) => w.id));
  const progressByWordId = new Map<string, string>();

  // Page through this user's progress rows filtered only by user_id, then
  // keep the ones for this deck's words client-side. A `.in()` filter with
  // thousands of word ids would instead build a URL tens of thousands of
  // characters long and fail outright — this side-steps that entirely.
  for (let from = 0; ; from += FETCH_PAGE_SIZE) {
    const { data: progressRows, error } = await supabase
      .from("user_word_progress")
      .select("word_id, next_review_at")
      .eq("user_id", userId)
      .order("word_id", { ascending: true })
      .range(from, from + FETCH_PAGE_SIZE - 1);

    if (error) throw error;

    const page = progressRows ?? [];
    page.forEach((row) => {
      if (wordIdSet.has(row.word_id)) {
        progressByWordId.set(row.word_id, row.next_review_at);
      }
    });

    if (page.length < FETCH_PAGE_SIZE) break;
  }

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
