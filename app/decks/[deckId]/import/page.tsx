import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DeckImportClient } from "./DeckImportClient";

interface DeckImportPageProps {
  params: Promise<{ deckId: string }>;
}

export default async function DeckImportPage({ params }: DeckImportPageProps) {
  const { deckId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-md px-4 py-8 text-center">
        請先登入才能匯入單字。
      </div>
    );
  }

  const { data: deck } = await supabase
    .from("decks")
    .select("id, name")
    .eq("id", deckId)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!deck) notFound();

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">匯入單字</h1>
        <p className="text-sm text-gray-600">單字庫：{deck.name}</p>
      </div>
      <DeckImportClient deckId={deck.id} userId={user.id} />
    </div>
  );
}
