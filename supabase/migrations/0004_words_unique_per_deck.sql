-- 同一個單字庫內，單字不應重複（避免重複匯入造成重複資料）
-- 時間戳: 2026-07-14

-- 匯入功能上線後累積的資料裡，同一 deck 內同一個 word 可能已經有重複列
-- （每次重新匯入同一份 Excel 都會新增一批，而不是覆蓋）。在加上 unique
-- constraint 之前，先清掉既有的重複列，每組重複只保留一列：
--   1. 優先保留「有 SRS 複習紀錄」的那一列（累積作答次數最多的），
--      避免使用者的複習進度被刪掉；
--   2. 其餘情況保留最早建立的那一列。
-- 其餘重複列會被刪除，其關聯的 word_distractors / word_examples /
-- word_forms（cascade）以及 user_word_progress（cascade）也會一併被刪除。
with ranked as (
  select
    w.id,
    row_number() over (
      partition by w.deck_id, w.word
      order by
        (
          select coalesce(sum(p.correct_count + p.wrong_count), 0)
          from user_word_progress p
          where p.word_id = w.id
        ) desc,
        w.created_at asc,
        w.id asc
    ) as rn
  from words w
)
delete from words
where id in (select id from ranked where rn > 1);

alter table words
  add constraint words_deck_id_word_key unique (deck_id, word);
