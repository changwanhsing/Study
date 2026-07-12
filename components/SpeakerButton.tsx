"use client";

import { speak } from "@/lib/speech";
import styles from "./FlashCard.module.css";

interface SpeakerButtonProps {
  text: string;
  lang?: string;
  size?: "default" | "small";
  ariaLabel?: string;
}

export function SpeakerButton({ text, lang = "en", size = "default", ariaLabel }: SpeakerButtonProps) {
  return (
    <button
      type="button"
      className={size === "small" ? `${styles.speakerBtn} ${styles.speakerBtnSmall}` : styles.speakerBtn}
      aria-label={ariaLabel ?? `朗讀 ${text}`}
      onClick={(e) => {
        e.stopPropagation();
        speak(text, lang);
      }}
    >
      🔊
    </button>
  );
}
