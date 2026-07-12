"use client";

import { useMemo } from "react";
import { QuizSession } from "@/components/QuizSession";
import { createClient } from "@/lib/supabase/client";
import { recordAnswer } from "@/lib/srs";
import type { QuizWord } from "@/lib/quiz-words";

interface DeckQuizClientProps {
  words: QuizWord[];
  deckLabel?: string;
  userId: string;
}

export function DeckQuizClient({ words, deckLabel, userId }: DeckQuizClientProps) {
  const supabase = useMemo(() => createClient(), []);

  return (
    <QuizSession
      words={words}
      deckLabel={deckLabel}
      preserveOrder
      onAnswer={({ wordId, correct }) => {
        recordAnswer(supabase, userId, wordId, correct).catch((err) => {
          console.error("Failed to record SRS progress", err);
        });
      }}
    />
  );
}
