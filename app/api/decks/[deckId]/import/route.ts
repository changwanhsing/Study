import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import type { ParsedImportRow } from "@/lib/excel-import";

// Give large imports (thousands of rows) room to finish within Vercel's
// serverless function time limit instead of being killed mid-import.
export const maxDuration = 60;

// Rows are bulk-inserted in chunks (one INSERT per table per chunk) rather
// than one row at a time — a fully sequential loop (4 round trips per row)
// is what previously caused imports of a couple thousand rows to blow past
// the function timeout and get killed with a non-JSON error response. 2000
// rows now takes ~4 chunks x a handful of round trips instead of ~8000
// round trips.
const CHUNK_SIZE = 500;

interface ImportRequestBody {
  rows: ParsedImportRow[];
  fileName: string;
}

async function processRow(
  supabase: SupabaseClient<Database>,
  deckId: string,
  batchId: string,
  row: ParsedImportRow
): Promise<boolean> {
  const data = row.data;

  try {
    const { data: wordData, error: wordErr } = await supabase
      .from("words")
      .insert({
        deck_id: deckId,
        word: data.word,
        ipa: data.ipa || null,
        pos: data.pos || null,
        correct_meaning: data.correctMeaning,
      })
      .select("id")
      .single();

    if (wordErr) throw wordErr;

    const wordId = wordData.id;

    if (data.wrongOptions.length > 0) {
      const distractorInserts = data.wrongOptions.map((text, i) => ({
        word_id: wordId,
        option_text: text,
        sort_order: i,
      }));
      const { error: distErr } = await supabase.from("word_distractors").insert(distractorInserts);
      if (distErr) throw distErr;
    }

    if (data.examples.length > 0) {
      const exampleInserts = data.examples.map((ex, i) => ({
        word_id: wordId,
        sentence_en: ex.en,
        sentence_zh: ex.zh || null,
        sort_order: i,
      }));
      const { error: exErr } = await supabase.from("word_examples").insert(exampleInserts);
      if (exErr) throw exErr;
    }

    if (data.forms.length > 0) {
      const formInserts = data.forms.map((form, i) => ({
        word_id: wordId,
        label: form.label || null,
        form_text: form.text,
        sort_order: i,
      }));
      const { error: formErr } = await supabase.from("word_forms").insert(formInserts);
      if (formErr) throw formErr;
    }

    return true;
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "未知錯誤";
    await supabase.from("import_batch_errors").insert({
      batch_id: batchId,
      row_number: row.rowNumber,
      error_message: errorMsg,
      raw_data: row.raw as any,
    });
    return false;
  }
}

/**
 * Bulk-inserts a chunk of rows in a small, fixed number of round trips
 * (one INSERT per table, all rows at once) instead of one round trip per
 * row. Falls back to per-row inserts for the chunk only if the bulk insert
 * fails, so a single bad row doesn't sacrifice the fast path for everyone
 * else and we can still pinpoint which row caused the failure.
 */
async function insertChunk(
  supabase: SupabaseClient<Database>,
  deckId: string,
  batchId: string,
  chunkRows: ParsedImportRow[]
): Promise<{ successCount: number; errorCount: number }> {
  const wordInserts = chunkRows.map((row) => ({
    deck_id: deckId,
    word: row.data.word,
    ipa: row.data.ipa || null,
    pos: row.data.pos || null,
    correct_meaning: row.data.correctMeaning,
  }));

  const { data: insertedWords, error: bulkErr } = await supabase
    .from("words")
    .insert(wordInserts)
    .select("id");

  if (!bulkErr && insertedWords && insertedWords.length === chunkRows.length) {
    const distractorInserts: { word_id: string; option_text: string; sort_order: number }[] = [];
    const exampleInserts: { word_id: string; sentence_en: string; sentence_zh: string | null; sort_order: number }[] = [];
    const formInserts: { word_id: string; label: string | null; form_text: string; sort_order: number }[] = [];

    chunkRows.forEach((row, i) => {
      const wordId = insertedWords[i].id;
      row.data.wrongOptions.forEach((text, j) =>
        distractorInserts.push({ word_id: wordId, option_text: text, sort_order: j })
      );
      row.data.examples.forEach((ex, j) =>
        exampleInserts.push({
          word_id: wordId,
          sentence_en: ex.en,
          sentence_zh: ex.zh || null,
          sort_order: j,
        })
      );
      row.data.forms.forEach((form, j) =>
        formInserts.push({ word_id: wordId, label: form.label || null, form_text: form.text, sort_order: j })
      );
    });

    await Promise.all([
      distractorInserts.length > 0
        ? supabase.from("word_distractors").insert(distractorInserts)
        : Promise.resolve(null),
      exampleInserts.length > 0
        ? supabase.from("word_examples").insert(exampleInserts)
        : Promise.resolve(null),
      formInserts.length > 0
        ? supabase.from("word_forms").insert(formInserts)
        : Promise.resolve(null),
    ]);

    return { successCount: chunkRows.length, errorCount: 0 };
  }

  // Bulk insert failed (e.g. one bad row) — fall back to per-row inserts so
  // we can identify and report exactly which row is at fault.
  const results = await Promise.all(chunkRows.map((row) => processRow(supabase, deckId, batchId, row)));
  const successCount = results.filter(Boolean).length;
  return { successCount, errorCount: results.length - successCount };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ deckId: string }> }
) {
  const { deckId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }

  const deck = await supabase
    .from("decks")
    .select("id")
    .eq("id", deckId)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!deck) {
    return NextResponse.json({ error: "單字庫不存在或無權限" }, { status: 404 });
  }

  const body: ImportRequestBody = await request.json();
  const { rows, fileName } = body;

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "沒有有效的行" }, { status: 400 });
  }

  // Create import batch record
  const { data: batch, error: batchErr } = await supabase
    .from("import_batches")
    .insert({
      deck_id: deckId,
      uploaded_by: user.id,
      file_name: fileName,
      status: "processing",
      total_rows: rows.length,
      success_rows: 0,
      error_rows: 0,
    })
    .select("id")
    .single();

  if (batchErr) {
    console.error("Failed to create import batch", batchErr);
    return NextResponse.json({ error: "無法建立匯入批次" }, { status: 500 });
  }

  const validRows = rows.filter((row) => row.isValid);
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < validRows.length; i += CHUNK_SIZE) {
    const chunk = validRows.slice(i, i + CHUNK_SIZE);
    const { successCount: sc, errorCount: ec } = await insertChunk(supabase, deckId, batch.id, chunk);
    successCount += sc;
    errorCount += ec;
  }

  // Update batch status
  await supabase
    .from("import_batches")
    .update({
      status: errorCount === 0 ? "completed" : "completed",
      success_rows: successCount,
      error_rows: errorCount,
    })
    .eq("id", batch.id);

  return NextResponse.json({
    batchId: batch.id,
    successCount,
    errorCount,
    totalRows: rows.length,
  });
}
