import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface AddCollaboratorRequest {
  userId: string;
  role: "viewer" | "editor";
}

export async function GET(
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

  // 驗證用戶是卡組擁有者
  const { data: deck, error: deckError } = await supabase
    .from("decks")
    .select("id")
    .eq("id", deckId)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (deckError || !deck) {
    return NextResponse.json({ error: "卡組不存在或無權限" }, { status: 404 });
  }

  // 獲取合作者列表
  const { data: collaborators, error: collabError } = await supabase
    .from("deck_collaborators")
    .select("*")
    .eq("deck_id", deckId);

  if (collabError) {
    console.error("Failed to fetch collaborators", collabError);
    return NextResponse.json({ error: "獲取合作者失敗" }, { status: 500 });
  }

  return NextResponse.json(collaborators);
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

  // 驗證用戶是卡組擁有者
  const { data: deck } = await supabase
    .from("decks")
    .select("id")
    .eq("id", deckId)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!deck) {
    return NextResponse.json({ error: "卡組不存在或無權限" }, { status: 404 });
  }

  const body: AddCollaboratorRequest = await request.json();

  if (!body.userId) {
    return NextResponse.json({ error: "缺少 userId" }, { status: 400 });
  }

  // 檢查是否已是合作者
  const { data: existing } = await supabase
    .from("deck_collaborators")
    .select("id")
    .eq("deck_id", deckId)
    .eq("user_id", body.userId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "用戶已是合作者" }, { status: 400 });
  }

  // 添加合作者
  const { error: addError } = await supabase
    .from("deck_collaborators")
    .insert({
      deck_id: deckId,
      user_id: body.userId,
      role: body.role,
    });

  if (addError) {
    console.error("Failed to add collaborator", addError);
    return NextResponse.json({ error: "添加合作者失敗" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ deckId: string }> }
) {
  const { deckId } = await params;
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "缺少 userId 参数" }, { status: 400 });
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }

  // 驗證用戶是卡組擁有者
  const { data: deck } = await supabase
    .from("decks")
    .select("id")
    .eq("id", deckId)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!deck) {
    return NextResponse.json({ error: "卡組不存在或無權限" }, { status: 404 });
  }

  // 移除合作者
  const { error: deleteError } = await supabase
    .from("deck_collaborators")
    .delete()
    .eq("deck_id", deckId)
    .eq("user_id", userId);

  if (deleteError) {
    console.error("Failed to remove collaborator", deleteError);
    return NextResponse.json({ error: "移除合作者失敗" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
