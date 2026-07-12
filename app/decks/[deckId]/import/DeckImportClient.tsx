"use client";

import { useState } from "react";
import { ExcelImportPreview } from "@/components/ExcelImportPreview";
import type { ParsedImportRow } from "@/lib/excel-import";

interface DeckImportClientProps {
  deckId: string;
  userId: string;
}

export function DeckImportClient({ deckId, userId }: DeckImportClientProps) {
  const [result, setResult] = useState<{
    successCount: number;
    errorCount: number;
    totalRows: number;
  } | null>(null);

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

  return <ExcelImportPreview deckId={deckId} onImportConfirm={handleImportConfirm} />;
}
