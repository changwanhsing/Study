"use client";

import Link from "next/link";
import { QuizSession } from "@/components/QuizSession";
import type { QuizWord } from "@/lib/quiz-words";

const SAMPLE_WORDS: QuizWord[] = [
  {
    id: "1",
    word: "apple",
    ipa: "/ˈæp.əl/",
    pos: "n. 名詞",
    correctMeaning: "蘋果",
    distractors: ["橘子", "香蕉", "葡萄"],
    examples: [
      { en: "She ate a red apple for breakfast.", zh: "她早餐吃了一顆紅蘋果。" },
      { en: "This pie is made of fresh apples.", zh: "這個派是用新鮮蘋果做的。" },
    ],
    forms: [{ label: "複數", text: "apples" }],
  },
  {
    id: "2",
    word: "run",
    ipa: "/rʌn/",
    pos: "v. 動詞",
    correctMeaning: "跑步",
    distractors: ["游泳", "跳躍", "行走"],
    examples: [
      { en: "He runs five kilometers every morning.", zh: "他每天早上跑五公里。" },
      { en: "They ran to catch the last bus.", zh: "他們跑去趕最後一班公車。" },
    ],
    forms: [
      { label: "過去式", text: "ran" },
      { label: "現在分詞", text: "running" },
    ],
  },
  {
    id: "3",
    word: "happy",
    ipa: "/ˈhæp.i/",
    pos: "adj. 形容詞",
    correctMeaning: "開心的",
    distractors: ["疲累的", "生氣的", "緊張的"],
    examples: [
      { en: "I feel happy when I learn new words.", zh: "學到新單字時我覺得很開心。" },
      { en: "She has a happy smile on her face.", zh: "她臉上帶著開心的笑容。" },
    ],
    forms: [
      { label: "比較級", text: "happier" },
      { label: "最高級", text: "happiest" },
    ],
  },
];

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-8 space-y-6">
      <div className="p-4 border-2 border-ink rounded-lg text-center space-y-2">
        <p className="text-sm text-ink-soft">
          這是範例卡組。要匯入自己的單字並開始學習嗎？
        </p>
        <Link
          href="/decks"
          className="inline-block px-5 py-2 bg-ink text-white font-bold rounded-full"
        >
          前往我的卡組
        </Link>
      </div>

      <QuizSession
        words={SAMPLE_WORDS}
        deckLabel={`範例單字庫（${SAMPLE_WORDS.length} 個）`}
        onAnswer={({ wordId, correct }) => {
          console.log("answered", wordId, correct);
        }}
      />
    </div>
  );
}
