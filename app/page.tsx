"use client";

import { useState } from "react";
import { FlashCard } from "@/components/FlashCard";

const SAMPLE_WORD = {
  word: "apple",
  ipa: "/ˈæp.əl/",
  pos: "n. 名詞",
  examples: [
    { en: "She ate a red apple for breakfast.", zh: "她早餐吃了一顆紅蘋果。" },
    { en: "This pie is made of fresh apples.", zh: "這個派是用新鮮蘋果做的。" },
  ],
  forms: [{ label: "複數", text: "apples" }],
};

export default function Home() {
  const [flipped, setFlipped] = useState(false);
  const [answered, setAnswered] = useState(false);

  return (
    <div className="mx-auto w-full max-w-md px-4 py-8">
      <div className="mb-4 flex items-center gap-2 font-[family-name:var(--font-baloo)] text-xl font-extrabold">
        <span className="inline-block h-2.5 w-2.5 rounded-full bg-[var(--highlighter)] shadow-[0_0_0_3px_var(--mint-bg)]" />
        單字小卡
      </div>

      <FlashCard
        word={SAMPLE_WORD.word}
        ipa={SAMPLE_WORD.ipa}
        pos={SAMPLE_WORD.pos}
        examples={SAMPLE_WORD.examples}
        forms={SAMPLE_WORD.forms}
        flipped={flipped}
        canFlip={answered}
        showFlipHint={answered}
        onFlip={() => setFlipped((f) => !f)}
      >
        <div className="mt-auto flex flex-col gap-2.5">
          <button
            type="button"
            className="flex items-center gap-2.5 rounded-2xl border-[2.5px] border-[var(--ink)] bg-white px-4 py-3 text-left font-[family-name:var(--font-nunito)] font-bold shadow-[3px_3px_0_var(--card-shadow)]"
            onClick={() => setAnswered(true)}
          >
            蘋果
          </button>
        </div>
      </FlashCard>

      <div className="mt-4 text-center">
        <button
          type="button"
          className="rounded-full bg-[var(--ink)] px-4 py-2 text-sm font-bold text-[var(--paper)]"
          onClick={() => {
            setFlipped(false);
            setAnswered(false);
          }}
        >
          重置示範卡片
        </button>
      </div>
    </div>
  );
}
