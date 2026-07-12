import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }

  try {
    // 獲取今天的複習詞數
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: todayReviews } = await supabase
      .from("user_word_progress")
      .select("id")
      .eq("user_id", user.id)
      .gte("last_reviewed_at", today.toISOString());

    // 獲取本週的複習詞數
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { data: weekReviews } = await supabase
      .from("user_word_progress")
      .select("id")
      .eq("user_id", user.id)
      .gte("last_reviewed_at", weekAgo.toISOString());

    // 獲取總詞數
    const { count: totalWords } = await supabase
      .from("user_word_progress")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    // 計算準確度
    const { data: allProgress } = await supabase
      .from("user_word_progress")
      .select("correct_count, wrong_count")
      .eq("user_id", user.id);

    let accuracy = 0;
    if (allProgress && allProgress.length > 0) {
      let totalCorrect = 0;
      let totalAttempts = 0;
      allProgress.forEach((p) => {
        totalCorrect += p.correct_count;
        totalAttempts += p.correct_count + p.wrong_count;
      });
      accuracy = totalAttempts > 0 ? (totalCorrect / totalAttempts) * 100 : 0;
    }

    // 獲取下一個複習時間
    const { data: nextReview } = await supabase
      .from("user_word_progress")
      .select("next_review_at")
      .eq("user_id", user.id)
      .gt("next_review_at", new Date().toISOString())
      .order("next_review_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    // 獲取最困難的單字（準確度最低的 5 個）
    const { data: difficultWords } = await supabase
      .from("user_word_progress")
      .select("word_id, correct_count, wrong_count, words(word, correct_meaning)")
      .eq("user_id", user.id)
      .gt("wrong_count", 0)
      .order("wrong_count", { ascending: false })
      .limit(5);

    return NextResponse.json({
      totalWordsLearned: totalWords || 0,
      todayReviewed: todayReviews?.length || 0,
      thisWeekReviewed: weekReviews?.length || 0,
      accuracy: Math.round(accuracy * 10) / 10,
      nextReviewAt: nextReview?.next_review_at,
      difficultWords: difficultWords || [],
    });
  } catch (error) {
    console.error("Failed to fetch statistics", error);
    return NextResponse.json({ error: "無法獲取統計" }, { status: 500 });
  }
}
