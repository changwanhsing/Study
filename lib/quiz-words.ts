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

/** Number of words drawn into a single quiz session. */
export const QUIZ_SESSION_SIZE = 50;

/**
 * How much a word's error rate (wrong / (wrong + correct)) skews its odds of
 * being picked, on top of a baseline weight of 1. A word that's always wrong
 * ends up ERROR_RATE_WEIGHT+1 times as likely to be drawn as one that's
 * always right.
 */
const ERROR_RATE_WEIGHT = 4;

/** Error rate assigned to words with no answer history yet, so they show up
 * in sessions at a moderate, not dominant, rate. */
const NEW_WORD_ERROR_RATE = 0.5;

/**
 * Weighted random sample of `count` items without replacement, using the
 * Efraimidis-Spirakis algorithm: each item gets a key = random()^(1/weight),
 * and the items with the largest keys win. Higher weight -> key skews closer
 * to 1 -> more likely to be selected.
 */
function weightedSample<T>(items: T[], weights: number[], count: number): T[] {
  if (items.length <= count) return items;

  const keyed = items.map((item, i) => ({
    item,
    key: Math.pow(Math.random(), 1 / weights[i]),
  }));
  keyed.sort((a, b) => b.key - a.key);
  return keyed.slice(0, count).map((k) => k.item);
}

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

interface WordProgress {
  nextReviewAt: string;
  errorRate: number;
}

function errorRateWeight(errorRate: number): number {
  return 1 + ERROR_RATE_WEIGHT * errorRate;
}

/**
 * Draws a capped, randomized quiz session: words due for review
 * (next_review_at <= now) come first, then words the user has never seen,
 * then words not yet due (soonest-upcoming first) as a last resort so a
 * session is never empty just because everything is scheduled for later.
 *
 * Within the "due" and "new" groups, selection is a weighted random sample
 * (not a plain shuffle) so words with a higher historical wrong-answer rate
 * are more likely to be picked — the session leans toward the words the
 * user actually struggles with, instead of covering the whole deck evenly.
 * The total session size is capped at QUIZ_SESSION_SIZE.
 */
export async function fetchQuizWordsForUser(
  supabase: SupabaseClient<Database>,
  deckId: string,
  userId: string
): Promise<QuizWord[]> {
  const words = await fetchQuizWords(supabase, deckId);
  if (words.length === 0) return words;

  const wordIdSet = new Set(words.map((w) => w.id));
  const progressByWordId = new Map<string, WordProgress>();

  // Page through this user's progress rows filtered only by user_id, then
  // keep the ones for this deck's words client-side. A `.in()` filter with
  // thousands of word ids would instead build a URL tens of thousands of
  // characters long and fail outright — this side-steps that entirely.
  for (let from = 0; ; from += FETCH_PAGE_SIZE) {
    const { data: progressRows, error } = await supabase
      .from("user_word_progress")
      .select("word_id, next_review_at, correct_count, wrong_count")
      .eq("user_id", userId)
      .order("word_id", { ascending: true })
      .range(from, from + FETCH_PAGE_SIZE - 1);

    if (error) throw error;

    const page = progressRows ?? [];
    page.forEach((row) => {
      if (wordIdSet.has(row.word_id)) {
        const attempts = row.correct_count + row.wrong_count;
        progressByWordId.set(row.word_id, {
          nextReviewAt: row.next_review_at,
          errorRate: attempts > 0 ? row.wrong_count / attempts : NEW_WORD_ERROR_RATE,
        });
      }
    });

    if (page.length < FETCH_PAGE_SIZE) break;
  }

  const now = Date.now();
  const due: QuizWord[] = [];
  const fresh: QuizWord[] = [];
  const later: { word: QuizWord; nextReviewAt: number }[] = [];
  const errorRateByWordId = new Map<string, number>();

  for (const word of words) {
    const progress = progressByWordId.get(word.id);
    if (!progress) {
      fresh.push(word);
      errorRateByWordId.set(word.id, NEW_WORD_ERROR_RATE);
    } else {
      errorRateByWordId.set(word.id, progress.errorRate);
      if (new Date(progress.nextReviewAt).getTime() <= now) {
        due.push(word);
      } else {
        later.push({ word, nextReviewAt: new Date(progress.nextReviewAt).getTime() });
      }
    }
  }

  later.sort((a, b) => a.nextReviewAt - b.nextReviewAt);

  const weightsFor = (group: QuizWord[]) =>
    group.map((w) => errorRateWeight(errorRateByWordId.get(w.id) ?? NEW_WORD_ERROR_RATE));

  const session: QuizWord[] = [];

  const dueSample = weightedSample(due, weightsFor(due), QUIZ_SESSION_SIZE);
  session.push(...shuffle(dueSample));

  if (session.length < QUIZ_SESSION_SIZE) {
    const remaining = QUIZ_SESSION_SIZE - session.length;
    const freshSample = weightedSample(fresh, weightsFor(fresh), remaining);
    session.push(...shuffle(freshSample));
  }

  if (session.length < QUIZ_SESSION_SIZE) {
    const remaining = QUIZ_SESSION_SIZE - session.length;
    session.push(...later.slice(0, remaining).map((l) => l.word));
  }

  return session;
}
