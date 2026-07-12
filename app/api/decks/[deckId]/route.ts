import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
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

  const { data: deck, error: deleteError } = await supabase
    .from("decks")
    .delete()
    .eq("id", deckId)
    .eq("owner_id", user.id)
    .select("id")
    .maybeSingle();

  if (deleteError) {
    console.error("Failed to delete deck", deleteError);
    return NextResponse.json({ error: "刪除卡組失敗" }, { status: 500 });
  }

  if (!deck) {
    return NextResponse.json({ error: "卡組不存在或無權限" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
