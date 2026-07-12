"use client";

import { useEffect, useState } from "react";
import { FlashCard } from "@/components/FlashCard";
import { shuffle } from "@/lib/shuffle";
import type { QuizWord } from "@/lib/quiz-words";
import styles from "./QuizSession.module.css";

export interface QuizSessionProps {
  words: QuizWord[];
  deckLabel?: string;
  onAnswer?: (result: { wordId: string; correct: boolean }) => void;
  /**
   * When true, `words` is used as-is instead of being shuffled — for callers
   * that already ordered words by SRS priority (due first, then new).
   */
  preserveOrder?: boolean;
}

export function QuizSession({ words, deckLabel, onAnswer, preserveOrder = false }: QuizSessionProps) {
  // Randomization must happen client-side only: computing it during the
  // initial render would make server- and client-rendered HTML diverge
  // (hydration mismatch), since SSR and the client each pick a different
  // random order.
  const [mounted, setMounted] = useState(false);
  const [order, setOrder] = useState<QuizWord[]>(words);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);

  const current = order[currentIndex];

  useEffect(() => {
    if (!preserveOrder) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time client-only randomization, not a derived-state anti-pattern
      setOrder(shuffle(words));
    }
    setMounted(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mounted || !current) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time client-only randomization, not a derived-state anti-pattern
    setShuffledOptions(shuffle([current.correctMeaning, ...current.distractors]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, current?.id]);

  if (!mounted) {
    return null;
  }

  if (order.length === 0) {
    return (
      <div className={styles.doneScreen}>
        <div className="emoji">📭</div>
        <h2>這個單字庫還沒有單字</h2>
      </div>
    );
  }

  if (currentIndex >= order.length) {
    return (
      <div className={styles.doneScreen}>
        <div className="emoji">🎉</div>
        <h2>全部完成了！</h2>
        <p className={styles.doneSubtitle}>
          這輪答對 {score} / {order.length} 題
        </p>
        <button
          type="button"
          className={styles.restartBtn}
          onClick={() => window.location.reload()}
        >
          再玩一輪
        </button>
      </div>
    );
  }

  function selectOption(opt: string) {
    if (answered || !current) return;
    setAnswered(true);
    setSelectedOption(opt);

    const correct = opt === current.correctMeaning;
    if (correct) setScore((s) => s + 1);
    onAnswer?.({ wordId: current.id, correct });
  }

  function nextQuestion() {
    setCurrentIndex((i) => i + 1);
    setAnswered(false);
    setSelectedOption(null);
    setFlipped(false);
  }

  return (
    <div>
      <div className={styles.topbar}>
        <div className={styles.brand}>
          <span className={styles.brandDot} />
          單字小卡
        </div>
        <div className={styles.scorePill}>✓ {score} 分</div>
      </div>

      {deckLabel ? (
        <div className={styles.doneSubtitle} style={{ marginBottom: 12 }}>
          {deckLabel}
        </div>
      ) : null}

      <div className={styles.progressRow}>
        <div className={styles.progressTrack}>
          <div
            className={styles.progressFill}
            style={{ width: `${(currentIndex / order.length) * 100}%` }}
          />
        </div>
        <span className={styles.progressLabel}>
          第 {currentIndex + 1} / {order.length} 題
        </span>
      </div>

      <div className={styles.scene}>
        <FlashCard
          word={current.word}
          ipa={current.ipa}
          pos={current.pos}
          examples={current.examples}
          forms={current.forms}
          flipped={flipped}
          canFlip={answered}
          showFlipHint={answered}
          onFlip={() => setFlipped((f) => !f)}
        >
          <div className={styles.options}>
            {shuffledOptions.map((opt, i) => {
              const isCorrectOpt = opt === current.correctMeaning;
              const isSelectedWrong = answered && opt === selectedOption && !isCorrectOpt;
              const showCorrect = answered && isCorrectOpt;

              return (
                <button
                  key={opt}
                  type="button"
                  disabled={answered}
                  className={[
                    styles.option,
                    showCorrect ? styles.optionCorrect : "",
                    isSelectedWrong ? styles.optionWrong : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => selectOption(opt)}
                >
                  <span className={styles.letter}>{String.fromCharCode(65 + i)}</span>
                  <span>{opt}</span>
                </button>
              );
            })}
          </div>
        </FlashCard>
      </div>

      <div className={styles.controls}>
        <button
          type="button"
          className={`${styles.nextBtn} ${answered ? styles.nextBtnActive : ""}`}
          onClick={nextQuestion}
        >
          下一題 →
        </button>
      </div>
    </div>
  );
}
