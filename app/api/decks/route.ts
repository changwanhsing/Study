import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }

  const { data: decks, error } = await supabase
    .from("decks")
    .select("id, name, description, created_at")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "無法獲取卡組列表" }, { status: 500 });
  }

  return NextResponse.json(decks);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }

  const body = await request.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";

  if (!name) {
    return NextResponse.json({ error: "卡組名稱不可為空" }, { status: 400 });
  }

  const { data: deck, error } = await supabase
    .from("decks")
    .insert({
      owner_id: user.id,
      name,
      description: typeof body.description === "string" ? body.description : null,
    })
    .select("id, name, description, created_at")
    .single();

  if (error) {
    console.error("Failed to create deck", error);
    return NextResponse.json({ error: "建立卡組失敗" }, { status: 500 });
  }

  return NextResponse.json(deck);
}
