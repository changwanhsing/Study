import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ParsedImportRow } from "@/lib/excel-import";

interface ImportRequestBody {
  rows: ParsedImportRow[];
  fileName: string;
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

  let successCount = 0;
  let errorCount = 0;

  // Process each row
  for (const row of rows) {
    if (!row.isValid) continue;

    const data = row.data;

    try {
      // Insert word
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

      // Insert distractors
      if (data.wrongOptions.length > 0) {
        const distractorInserts = data.wrongOptions.map((text, i) => ({
          word_id: wordId,
          option_text: text,
          sort_order: i,
        }));
        const { error: distErr } = await supabase
          .from("word_distractors")
          .insert(distractorInserts);
        if (distErr) throw distErr;
      }

      // Insert examples
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

      // Insert forms
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

      successCount++;
    } catch (err) {
      errorCount++;
      const errorMsg = err instanceof Error ? err.message : "未知錯誤";
      await supabase.from("import_batch_errors").insert({
        batch_id: batch.id,
        row_number: row.rowNumber,
        error_message: errorMsg,
        raw_data: row.raw as any,
      });
    }
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
