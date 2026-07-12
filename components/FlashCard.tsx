"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { speak } from "@/lib/speech";
import { SpeakerButton } from "@/components/SpeakerButton";
import styles from "./FlashCard.module.css";

export interface FlashCardExample {
  en: string;
  zh?: string | null;
}

export interface FlashCardForm {
  label?: string | null;
  text: string;
}

export interface FlashCardProps {
  word: string;
  ipa?: string | null;
  pos?: string | null;
  lang?: string;
  examples?: FlashCardExample[];
  forms?: FlashCardForm[];
  flipped: boolean;
  canFlip?: boolean;
  onFlip: () => void;
  frontEyebrow?: string;
  showFlipHint?: boolean;
  /** Rendered on the front face below the IPA row, e.g. multiple-choice options. */
  children?: ReactNode;
}

export function FlashCard({
  word,
  ipa,
  pos,
  lang = "en",
  examples = [],
  forms = [],
  flipped,
  canFlip = true,
  onFlip,
  frontEyebrow = "這個字是什麼意思？",
  showFlipHint = false,
  children,
}: FlashCardProps) {
  const wasFlipped = useRef(false);

  useEffect(() => {
    if (flipped && !wasFlipped.current) {
      const reduceMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const timer = setTimeout(() => speak(word, lang), reduceMotion ? 0 : 350);
      wasFlipped.current = true;
      return () => clearTimeout(timer);
    }
    if (!flipped) {
      wasFlipped.current = false;
    }
  }, [flipped, word, lang]);

  function handleClick() {
    if (!canFlip) return;
    onFlip();
  }

  return (
    <div className={styles.scene}>
      <div
        className={`${styles.card} ${flipped ? styles.flipped : ""}`}
        onClick={handleClick}
        role="button"
        tabIndex={canFlip ? 0 : -1}
        aria-pressed={flipped}
        aria-disabled={!canFlip}
        onKeyDown={(e) => {
          if (!canFlip) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onFlip();
          }
        }}
      >
        <div className={`${styles.face}`}>
          <div className={styles.tape} />
          <div className={styles.hintEyebrow}>{frontEyebrow}</div>
          <div className={styles.wordTitle}>{word}</div>
          <div className={styles.ipaRow}>
            <span className={styles.ipa}>{ipa ?? ""}</span>
          </div>

          {children}

          <div
            className={styles.flipTip}
            style={{ visibility: showFlipHint ? "visible" : "hidden" }}
          >
            👆 點卡片看詳解
          </div>
        </div>

        <div className={`${styles.face} ${styles.faceBack}`}>
          <div className={`${styles.tape} ${styles.tapeRight}`} />
          <div className={styles.posRow}>
            {pos ? <span className={styles.posBadge}>{pos}</span> : null}
          </div>
          <div className={styles.backWord}>{word}</div>
          <div className={styles.ipaRow}>
            <span className={styles.ipa}>{ipa ?? ""}</span>
            <SpeakerButton text={word} lang={lang} />
          </div>

          {examples.length > 0 && (
            <>
              <hr className={styles.divider} />
              <div className={styles.sectionLabel}>例句</div>
              {examples.map((ex, i) => (
                <div className={styles.example} key={i}>
                  <SpeakerButton text={ex.en} lang={lang} size="small" />
                  <div className={styles.exampleText}>
                    <div className={styles.exampleEn}>{ex.en}</div>
                    {ex.zh ? <div className={styles.exampleZh}>{ex.zh}</div> : null}
                  </div>
                </div>
              ))}
            </>
          )}

          {forms.length > 0 && (
            <>
              <hr className={styles.divider} />
              <div className={styles.sectionLabel}>詞形變化</div>
              <div className={styles.formsRow}>
                {forms.map((f, i) => (
                  <span className={styles.formChip} key={i}>
                    {f.label ? `${f.label} ` : ""}
                    {f.text}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
