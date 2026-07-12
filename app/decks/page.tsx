import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NewDeckForm } from "./NewDeckForm";
import { DeckListItem } from "./DeckListItem";

export default async function DecksPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-md px-4 py-16 text-center space-y-4">
        <p>請先登入才能查看你的卡組。</p>
        <Link
          href="/login"
          className="inline-block px-6 py-3 bg-ink text-white font-bold rounded-full"
        >
          前往登入
        </Link>
      </div>
    );
  }

  const { data: decks } = await supabase
    .from("decks")
    .select("id, name, description, created_at")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const deckIds = (decks ?? []).map((d) => d.id);
  const wordCounts = new Map<string, number>();
  if (deckIds.length > 0) {
    const { data: wordRows } = await supabase
      .from("words")
      .select("deck_id")
      .in("deck_id", deckIds);
    wordRows?.forEach((w) => {
      wordCounts.set(w.deck_id, (wordCounts.get(w.deck_id) ?? 0) + 1);
    });
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">我的卡組</h1>
        <p className="text-sm text-ink-soft">{user.email}</p>
      </div>

      <NewDeckForm />

      {!decks || decks.length === 0 ? (
        <p className="text-center text-ink-soft py-8">
          還沒有任何卡組，建立一個開始學習吧！
        </p>
      ) : (
        <ul className="space-y-3">
          {decks.map((deck) => (
            <DeckListItem
              key={deck.id}
              id={deck.id}
              name={deck.name}
              description={deck.description}
              wordCount={wordCounts.get(deck.id) ?? 0}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
