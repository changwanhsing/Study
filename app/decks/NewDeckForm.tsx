"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NewDeckForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/decks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "建立失敗");
      }

      setName("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "未知錯誤");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        placeholder="新卡組名稱"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="flex-1 px-3 py-2 border-2 border-ink rounded-lg"
        disabled={isSubmitting}
      />
      <button
        type="submit"
        disabled={isSubmitting || !name.trim()}
        className="px-4 py-2 bg-ink text-white font-bold rounded-full disabled:opacity-50"
      >
        {isSubmitting ? "建立中..." : "+ 新增"}
      </button>
      {error && <span className="text-coral text-sm self-center">{error}</span>}
    </form>
  );
}
