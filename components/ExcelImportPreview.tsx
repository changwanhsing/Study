"use client";

import { useRef, useState } from "react";
import { parseWorkbookFile, downloadImportTemplate, type ParsedImportRow } from "@/lib/excel-import";
import styles from "./ExcelImportPreview.module.css";

interface ExcelImportPreviewProps {
  deckId: string;
  onImportConfirm: (rows: ParsedImportRow[]) => Promise<void>;
}

export function ExcelImportPreview({ deckId, onImportConfirm }: ExcelImportPreviewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedRows, setParsedRows] = useState<ParsedImportRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError("");
    setParsedRows([]);

    try {
      const rows = await parseWorkbookFile(file);
      setParsedRows(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "未知錯誤");
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const validRows = parsedRows.filter((r) => r.isValid);
  const invalidRows = parsedRows.filter((r) => !r.isValid);
  const allValid = invalidRows.length === 0 && parsedRows.length > 0;

  const handleSubmit = async () => {
    if (!allValid) return;
    setIsSubmitting(true);
    try {
      await onImportConfirm(validRows);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.actions}>
        <label htmlFor="excel-upload" className={styles.uploadLabel}>
          📁 上傳單字庫檔案
        </label>
        <input
          id="excel-upload"
          ref={fileInputRef}
          type="file"
          accept=".xlsx"
          onChange={handleFileSelect}
          style={{ display: "none" }}
        />
        <button className={styles.templateBtn} onClick={downloadImportTemplate}>
          下載範本
        </button>
      </div>

      {error && <div className={`${styles.summary} ${styles.summaryErr}`}>❌ {error}</div>}

      {parsedRows.length > 0 && (
        <>
          <div className={`${styles.summary} ${allValid ? styles.summaryOk : styles.summaryErr}`}>
            {allValid
              ? `✓ 全部驗證通過，${validRows.length} 列可匯入`
              : `⚠ ${validRows.length} 列正常，${invalidRows.length} 列有誤`}
          </div>

          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>列號</th>
                  <th>單字</th>
                  <th>正確意思</th>
                  <th>例句</th>
                  <th>詞形</th>
                  <th>狀態</th>
                </tr>
              </thead>
              <tbody>
                {parsedRows.map((row) => (
                  <tr key={row.rowNumber} className={!row.isValid ? styles.rowInvalid : undefined}>
                    <td className={styles.rowNumber}>{row.rowNumber}</td>
                    <td>{row.data.word || "—"}</td>
                    <td>{row.data.correctMeaning || "—"}</td>
                    <td>{row.data.examples.length > 0 ? `${row.data.examples.length} 個` : "—"}</td>
                    <td>{row.data.forms.length > 0 ? `${row.data.forms.length} 個` : "—"}</td>
                    <td>
                      {row.isValid ? (
                        <span style={{ color: "var(--mint)" }}>✓ 正常</span>
                      ) : (
                        <div className={styles.errorList}>
                          {row.errors.map((err, i) => (
                            <div key={i}>❌ {err}</div>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            className={styles.confirmBtn}
            onClick={handleSubmit}
            disabled={!allValid || isSubmitting}
          >
            {isSubmitting ? "匯入中..." : "確認匯入"}
          </button>
        </>
      )}
    </div>
  );
}
