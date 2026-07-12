import { SupabaseClient, createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

/**
 * Test utilities for Supabase integration tests.
 * Provides helper functions to set up test data and verify RLS policies.
 */

interface TestUser {
  id: string;
  email: string;
  client: SupabaseClient<Database>;
}

/**
 * Create a test user with their own Supabase client
 * NOTE: Requires valid Supabase credentials and test user setup
 */
export async function createTestUser(email: string): Promise<TestUser> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL!;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;

  // In a real test setup, would authenticate with this email
  // and get a valid session token
  const client = createClient<Database>(supabaseUrl, supabaseAnonKey);

  return {
    id: "", // Would be populated from auth response
    email,
    client,
  };
}

/**
 * Create a test deck for a user
 */
export async function createTestDeck(
  user: TestUser,
  deckName: string,
  description?: string
) {
  const { data, error } = await user.client.from("decks").insert({
    name: deckName,
    description,
  });

  if (error) throw error;
  return data;
}

/**
 * Create test words with distractors and examples
 */
export async function createTestWord(
  user: TestUser,
  deckId: string,
  word: string,
  correctMeaning: string,
  options?: {
    ipa?: string;
    pos?: string;
    wrongOptions?: string[];
    examples?: Array<{ en: string; zh?: string }>;
    forms?: Array<{ label?: string; text: string }>;
  }
) {
  const { data: wordData, error: wordError } = await user.client
    .from("words")
    .insert({
      deck_id: deckId,
      word,
      ipa: options?.ipa,
      pos: options?.pos,
      correct_meaning: correctMeaning,
    })
    .select()
    .single();

  if (wordError) throw wordError;

  const wordId = wordData.id;

  // Insert distractors
  if (options?.wrongOptions?.length) {
    const { error: distError } = await user.client.from("word_distractors").insert(
      options.wrongOptions.map((text, i) => ({
        word_id: wordId,
        option_text: text,
        sort_order: i,
      }))
    );
    if (distError) throw distError;
  }

  // Insert examples
  if (options?.examples?.length) {
    const { error: exError } = await user.client.from("word_examples").insert(
      options.examples.map((ex, i) => ({
        word_id: wordId,
        sentence_en: ex.en,
        sentence_zh: ex.zh,
        sort_order: i,
      }))
    );
    if (exError) throw exError;
  }

  // Insert forms
  if (options?.forms?.length) {
    const { error: formError } = await user.client.from("word_forms").insert(
      options.forms.map((form, i) => ({
        word_id: wordId,
        label: form.label,
        form_text: form.text,
        sort_order: i,
      }))
    );
    if (formError) throw formError;
  }

  return wordData;
}

/**
 * Record a word review for a user
 */
export async function recordUserProgress(
  user: TestUser,
  wordId: string,
  correct: boolean
) {
  const { data, error } = await user.client.from("user_word_progress").upsert(
    {
      word_id: wordId,
      box_level: correct ? 1 : 0,
      ease_factor: correct ? 2.6 : 2.3,
      next_review_at: new Date(Date.now() + (correct ? 86400000 : 600000)).toISOString(),
    },
    {
      onConflict: "user_id,word_id",
    }
  );

  if (error) throw error;
  return data;
}

/**
 * Verify that user B cannot access user A's deck
 */
export async function verifyDeckIsolation(userA: TestUser, userB: TestUser, deckId: string) {
  // User A should be able to see their deck
  const { data: deckA } = await userA.client
    .from("decks")
    .select()
    .eq("id", deckId)
    .single();

  if (!deckA) {
    throw new Error("User A should be able to see their own deck");
  }

  // User B should NOT see User A's deck
  const { data: deckB } = await userB.client
    .from("decks")
    .select()
    .eq("id", deckId)
    .maybeSingle();

  if (deckB) {
    throw new Error("User B should not be able to see User A's deck");
  }

  return { userACanSee: true, userBCannotSee: true };
}

/**
 * Verify that user B cannot access words in user A's deck
 */
export async function verifyWordIsolation(userA: TestUser, userB: TestUser, deckId: string) {
  // User A should see words in their deck
  const { data: wordsA } = await userA.client
    .from("words")
    .select()
    .eq("deck_id", deckId);

  if (!wordsA || wordsA.length === 0) {
    throw new Error("User A should see words in their deck");
  }

  // User B should not see words in User A's deck
  const { data: wordsB } = await userB.client
    .from("words")
    .select()
    .eq("deck_id", deckId);

  if (wordsB && wordsB.length > 0) {
    throw new Error("User B should not see words in User A's deck");
  }

  return { userACanSee: true, userBCannotSee: true };
}

/**
 * Verify that each user sees only their own progress
 */
export async function verifyProgressIsolation(
  userA: TestUser,
  userB: TestUser,
  wordId: string
) {
  // Record progress for both users
  await recordUserProgress(userA, wordId, true);
  await recordUserProgress(userB, wordId, false);

  // User A should see their progress
  const { data: progressA } = await userA.client
    .from("user_word_progress")
    .select()
    .eq("word_id", wordId)
    .maybeSingle();

  if (!progressA) {
    throw new Error("User A should see their own progress");
  }

  // User B should see their progress (different record)
  const { data: progressB } = await userB.client
    .from("user_word_progress")
    .select()
    .eq("word_id", wordId)
    .maybeSingle();

  if (!progressB) {
    throw new Error("User B should see their own progress");
  }

  // Verify they're different records
  if (progressA.id === progressB.id) {
    throw new Error("Each user should have separate progress records");
  }

  return {
    userAProgress: progressA,
    userBProgress: progressB,
    isolated: progressA.id !== progressB.id,
  };
}

/**
 * Clean up test data (for use in teardown)
 */
export async function cleanupTestData(user: TestUser, deckId: string) {
  const { error } = await user.client.from("decks").delete().eq("id", deckId);

  if (error) throw error;
}
