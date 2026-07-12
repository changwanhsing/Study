"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    const supabase = createClient();

    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/decks");
        router.refresh();
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage("註冊成功！請檢查電郵完成驗證後再登入。");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "發生錯誤");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-sm px-4 py-16">
      <h1 className="text-2xl font-bold mb-6 text-center">
        {mode === "signin" ? "登入" : "註冊"} 單字小卡
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block font-bold text-sm mb-1">
            電郵
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border-2 border-ink rounded-lg"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label htmlFor="password" className="block font-bold text-sm mb-1">
            密碼
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border-2 border-ink rounded-lg"
            disabled={isSubmitting}
          />
        </div>

        {error && (
          <div className="p-3 bg-coral-bg text-coral rounded text-sm font-bold">❌ {error}</div>
        )}

        {message && (
          <div className="p-3 bg-mint-bg text-mint rounded text-sm font-bold">✓ {message}</div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full px-4 py-3 bg-ink text-white font-bold rounded-full disabled:opacity-50"
        >
          {isSubmitting ? "處理中..." : mode === "signin" ? "登入" : "註冊"}
        </button>
      </form>

      <button
        onClick={() => {
          setMode(mode === "signin" ? "signup" : "signin");
          setError("");
          setMessage("");
        }}
        className="w-full mt-4 text-sm text-ink-soft underline"
      >
        {mode === "signin" ? "還沒有帳戶？點此註冊" : "已有帳戶？點此登入"}
      </button>
    </div>
  );
}
