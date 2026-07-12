-- 卡組語言（用於語音朗讀選擇正確的發音引擎）
-- 時間戳: 2026-07-12

alter table decks
  add column lang text not null default 'en';

comment on column decks.lang is '卡組單字的語言代碼，例如 en（英文）、ja（日文），用於語音朗讀選擇對應發音';
