"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface DeckListItemProps {
  id: string;
  name: string;
  description: string | null;
}

export function DeckListItem({ id, name, description }: DeckListItemProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`確定要刪除卡組「${name}」嗎？此動作無法復原，卡組內的所有單字與學習紀錄都會被永久刪除。`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/decks/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "刪除失敗");
      }
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "刪除失敗");
      setIsDeleting(false);
    }
  };

  return (
    <li className="p-4 border-2 border-ink rounded-lg flex items-center justify-between gap-4">
      <div>
        <div className="font-bold">{name}</div>
        {description && <div className="text-sm text-ink-soft">{description}</div>}
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <Link
          href={`/decks/${id}`}
          className="px-3 py-1.5 text-sm font-bold rounded-full bg-mint text-white"
        >
          測驗
        </Link>
        <Link
          href={`/decks/${id}/import`}
          className="px-3 py-1.5 text-sm font-bold rounded-full bg-violet text-white"
        >
          匯入 Excel
        </Link>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="px-3 py-1.5 text-sm font-bold rounded-full bg-coral text-white disabled:opacity-50"
        >
          {isDeleting ? "刪除中..." : "刪除"}
        </button>
      </div>
    </li>
  );
}
