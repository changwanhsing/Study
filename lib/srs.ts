import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

/**
 * Leitner-box scheduling with an SM-2-style ease factor.
 * box_level indexes into BOX_INTERVAL_DAYS; the actual next-review gap is
 * BOX_INTERVAL_DAYS[box_level] * ease_factor days. Wrong answers demote the
 * box and shrink the ease factor; the word comes back for a short retry
 * instead of waiting for the box's full interval.
 */
export const BOX_INTERVAL_DAYS = [0, 1, 2, 4, 8, 16, 32, 64];
export const MAX_BOX_LEVEL = BOX_INTERVAL_DAYS.length - 1;
export const MIN_EASE_FACTOR = 1.3;
export const MAX_EASE_FACTOR = 3.0;
export const DEFAULT_EASE_FACTOR = 2.5;
export const WRONG_ANSWER_RETRY_MINUTES = 10;

export interface SrsState {
  boxLevel: number;
  easeFactor: number;
  correctCount: number;
  wrongCount: number;
}

export interface SrsUpdate extends SrsState {
  nextReviewAt: Date;
  lastReviewedAt: Date;
}

export function computeNextState(current: SrsState, correct: boolean, now = new Date()): SrsUpdate {
  if (correct) {
    const boxLevel = Math.min(current.boxLevel + 1, MAX_BOX_LEVEL);
    const easeFactor = Math.min(current.easeFactor + 0.1, MAX_EASE_FACTOR);
    const intervalDays = BOX_INTERVAL_DAYS[boxLevel] * easeFactor;
    const nextReviewAt = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);
    return {
      boxLevel,
      easeFactor,
      correctCount: current.correctCount + 1,
      wrongCount: current.wrongCount,
      nextReviewAt,
      lastReviewedAt: now,
    };
  }

  const boxLevel = Math.max(current.boxLevel - 1, 0);
  const easeFactor = Math.max(current.easeFactor - 0.2, MIN_EASE_FACTOR);
  const nextReviewAt = new Date(now.getTime() + WRONG_ANSWER_RETRY_MINUTES * 60 * 1000);
  return {
    boxLevel,
    easeFactor,
    correctCount: current.correctCount,
    wrongCount: current.wrongCount + 1,
    nextReviewAt,
    lastReviewedAt: now,
  };
}

export async function recordAnswer(
  supabase: SupabaseClient<Database>,
  userId: string,
  wordId: string,
  correct: boolean
): Promise<void> {
  const { data: existing, error: fetchError } = await supabase
    .from("user_word_progress")
    .select("box_level, ease_factor, correct_count, wrong_count")
    .eq("user_id", userId)
    .eq("word_id", wordId)
    .maybeSingle();

  if (fetchError) throw fetchError;

  const current: SrsState = existing
    ? {
        boxLevel: existing.box_level,
        easeFactor: existing.ease_factor,
        correctCount: existing.correct_count,
        wrongCount: existing.wrong_count,
      }
    : {
        boxLevel: 0,
        easeFactor: DEFAULT_EASE_FACTOR,
        correctCount: 0,
        wrongCount: 0,
      };

  const next = computeNextState(current, correct);

  const { error: upsertError } = await supabase.from("user_word_progress").upsert(
    {
      user_id: userId,
      word_id: wordId,
      box_level: next.boxLevel,
      ease_factor: next.easeFactor,
      correct_count: next.correctCount,
      wrong_count: next.wrongCount,
      next_review_at: next.nextReviewAt.toISOString(),
      last_reviewed_at: next.lastReviewedAt.toISOString(),
    },
    { onConflict: "user_id,word_id" }
  );

  if (upsertError) throw upsertError;
}
