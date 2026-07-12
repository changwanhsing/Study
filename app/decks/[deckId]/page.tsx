import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchQuizWordsForUser } from "@/lib/quiz-words";
import { DeckQuizClient } from "./DeckQuizClient";

// Large decks (thousands of words) need several sequential paginated
// requests to fetch words + SRS progress; give this page room to finish
// within Vercel's serverless function time limit instead of erroring out.
export const maxDuration = 60;

interface DeckQuizPageProps {
  params: Promise<{ deckId: string }>;
}

export default async function DeckQuizPage({ params }: DeckQuizPageProps) {
  const { deckId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-md px-4 py-8 text-center">
        請先登入才能開始測驗。
      </div>
    );
  }

  const { data: deck } = await supabase
    .from("decks")
    .select("name, lang")
    .eq("id", deckId)
    .maybeSingle();

  if (!deck) notFound();

  const words = await fetchQuizWordsForUser(supabase, deckId, user.id);

  return (
    <div className="mx-auto w-full max-w-md px-4 py-8">
      <DeckQuizClient words={words} deckLabel={deck.name} lang={deck.lang} userId={user.id} />
    </div>
  );
}
