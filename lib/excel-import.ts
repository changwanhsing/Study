import * as XLSX from "xlsx";
import type { QuizWord } from "@/lib/quiz-words";

export const IMPORT_TEMPLATE_HEADERS = [
  "word",
  "ipa",
  "pos",
  "correct_meaning",
  "wrong_option_1",
  "wrong_option_2",
  "wrong_option_3",
  "example1_en",
  "example1_zh",
  "example2_en",
  "example2_zh",
  "form1_label",
  "form1_text",
  "form2_label",
  "form2_text",
] as const;

export interface ImportRowData {
  word: string;
  ipa: string;
  pos: string;
  correctMeaning: string;
  wrongOptions: string[];
  examples: { en: string; zh: string }[];
  forms: { label: string; text: string }[];
}

export interface ParsedImportRow {
  /** 1-based row number as it appears in the Excel file (header is row 1). */
  rowNumber: number;
  data: ImportRowData;
  errors: string[];
  isValid: boolean;
  /** Original raw cell values, kept for error re-download / re-upload. */
  raw: Record<string, unknown>;
}

function str(value: unknown): string {
  return String(value ?? "").trim();
}

function parseRawRow(raw: Record<string, unknown>, rowNumber: number): ParsedImportRow {
  const word = str(raw.word);
  const correctMeaning = str(raw.correct_meaning);

  const wrongOptions = [raw.wrong_option_1, raw.wrong_option_2, raw.wrong_option_3]
    .map(str)
    .filter(Boolean);

  const examples: { en: string; zh: string }[] = [];
  if (str(raw.example1_en)) examples.push({ en: str(raw.example1_en), zh: str(raw.example1_zh) });
  if (str(raw.example2_en)) examples.push({ en: str(raw.example2_en), zh: str(raw.example2_zh) });

  const forms: { label: string; text: string }[] = [];
  if (str(raw.form1_text)) forms.push({ label: str(raw.form1_label), text: str(raw.form1_text) });
  if (str(raw.form2_text)) forms.push({ label: str(raw.form2_label), text: str(raw.form2_text) });

  const errors: string[] = [];
  if (!word) errors.push("缺少 word（單字）");
  if (!correctMeaning) errors.push("缺少 correct_meaning（正確中文意思）");

  return {
    rowNumber,
    data: {
      word,
      ipa: str(raw.ipa),
      pos: str(raw.pos),
      correctMeaning,
      wrongOptions,
      examples,
      forms,
    },
    errors,
    isValid: errors.length === 0,
    raw,
  };
}

export function parseWorkbookFile(file: File): Promise<ParsedImportRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
        resolve(rows.map((row, i) => parseRawRow(row, i + 2)));
      } catch {
        reject(new Error("檔案格式無法解析，請確認是 .xlsx 檔案。"));
      }
    };
    reader.onerror = () => reject(new Error("檔案讀取失敗。"));
    reader.readAsArrayBuffer(file);
  });
}

export function downloadImportTemplate() {
  const sampleRow = [
    "apple",
    "/ˈæp.əl/",
    "n. 名詞",
    "蘋果",
    "橘子",
    "香蕉",
    "葡萄",
    "She ate a red apple for breakfast.",
    "她早餐吃了一顆紅蘋果。",
    "This pie is made of fresh apples.",
    "這個派是用新鮮蘋果做的。",
    "複數",
    "apples",
    "",
    "",
  ];
  const ws = XLSX.utils.aoa_to_sheet([[...IMPORT_TEMPLATE_HEADERS], sampleRow]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "單字庫");
  XLSX.writeFile(wb, "單字匯入範本.xlsx");
}

/**
 * Exports a deck's words to the same column layout as the import template,
 * so the file can be edited and re-imported. Only the first 3 wrong options,
 * 2 examples, and 2 forms are written per word — matching the import format's
 * fixed columns — so any extras beyond that are dropped.
 */
export function exportWordsToExcel(deckName: string, words: QuizWord[]) {
  const rows = words.map((w) => [
    w.word,
    w.ipa ?? "",
    w.pos ?? "",
    w.correctMeaning,
    w.distractors[0] ?? "",
    w.distractors[1] ?? "",
    w.distractors[2] ?? "",
    w.examples[0]?.en ?? "",
    w.examples[0]?.zh ?? "",
    w.examples[1]?.en ?? "",
    w.examples[1]?.zh ?? "",
    w.forms[0]?.label ?? "",
    w.forms[0]?.text ?? "",
    w.forms[1]?.label ?? "",
    w.forms[1]?.text ?? "",
  ]);

  const ws = XLSX.utils.aoa_to_sheet([[...IMPORT_TEMPLATE_HEADERS], ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "單字庫");
  XLSX.writeFile(wb, `${deckName || "單字卡組"}.xlsx`);
}
