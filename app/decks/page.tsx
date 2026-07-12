import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NewDeckForm } from "./NewDeckForm";

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
            <li
              key={deck.id}
              className="p-4 border-2 border-ink rounded-lg flex items-center justify-between gap-4"
            >
              <div>
                <div className="font-bold">{deck.name}</div>
                {deck.description && (
                  <div className="text-sm text-ink-soft">{deck.description}</div>
                )}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Link
                  href={`/decks/${deck.id}`}
                  className="px-3 py-1.5 text-sm font-bold rounded-full bg-mint text-white"
                >
                  測驗
                </Link>
                <Link
                  href={`/decks/${deck.id}/import`}
                  className="px-3 py-1.5 text-sm font-bold rounded-full bg-violet text-white"
                >
                  匯入 Excel
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
