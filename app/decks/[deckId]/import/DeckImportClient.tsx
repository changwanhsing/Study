"use client";

import { useState } from "react";
import { ExcelImportPreview } from "@/components/ExcelImportPreview";
import { exportWordsToExcel, type ParsedImportRow } from "@/lib/excel-import";
import { createClient } from "@/lib/supabase/client";
import { fetchQuizWords } from "@/lib/quiz-words";

interface DeckImportClientProps {
  deckId: string;
  userId: string;
  deckName: string;
}

export function DeckImportClient({ deckId, userId, deckName }: DeckImportClientProps) {
  const [result, setResult] = useState<{
    successCount: number;
    errorCount: number;
    totalRows: number;
  } | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const supabase = createClient();
      const words = await fetchQuizWords(supabase, deckId);
      if (words.length === 0) {
        alert("這個卡組還沒有單字可以匯出。");
        return;
      }
      exportWordsToExcel(deckName, words);
    } catch (err) {
      alert(err instanceof Error ? err.message : "匯出失敗");
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportConfirm = async (rows: ParsedImportRow[]) => {
    try {
      const response = await fetch(`/api/decks/${deckId}/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows,
          fileName: `import-${Date.now()}.xlsx`,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "匯入失敗");
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      alert(err instanceof Error ? err.message : "匯入出錯");
    }
  };

  if (result) {
    return (
      <div className="rounded-lg border-2 border-green-500 bg-green-50 p-6">
        <h2 className="mb-4 text-lg font-bold">✓ 匯入完成</h2>
        <div className="space-y-2 text-sm">
          <p>
            成功匯入：<strong>{result.successCount}</strong> 個單字
          </p>
          {result.errorCount > 0 && (
            <p className="text-red-600">
              匯入失敗：<strong>{result.errorCount}</strong> 列
            </p>
          )}
          <p className="text-gray-600">共處理 {result.totalRows} 列</p>
        </div>
        <button
          onClick={() => setResult(null)}
          className="mt-6 rounded-full bg-black px-6 py-2 font-bold text-white"
        >
          返回匯入
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        onClick={handleExport}
        disabled={isExporting}
        className="px-4 py-2 text-sm font-bold rounded-full bg-violet-bg text-violet disabled:opacity-50"
      >
        {isExporting ? "匯出中..." : "匯出目前卡組為 Excel"}
      </button>
      <ExcelImportPreview deckId={deckId} onImportConfirm={handleImportConfirm} />
    </div>
  );
}
