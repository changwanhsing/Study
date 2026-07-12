-- 單字小卡 初始 schema
-- 對應 vocab-db-schema.md v2

-- ============================================================
-- decks
-- ============================================================
create table decks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index decks_owner_id_idx on decks(owner_id);

-- ============================================================
-- words
-- ============================================================
create table words (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references decks(id) on delete cascade,
  word text not null,
  ipa text,
  pos text,
  correct_meaning text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index words_deck_id_idx on words(deck_id);

-- ============================================================
-- word_distractors
-- ============================================================
create table word_distractors (
  id uuid primary key default gen_random_uuid(),
  word_id uuid not null references words(id) on delete cascade,
  option_text text not null,
  sort_order int2 not null default 0
);

create index word_distractors_word_id_idx on word_distractors(word_id);

-- ============================================================
-- word_examples
-- ============================================================
create table word_examples (
  id uuid primary key default gen_random_uuid(),
  word_id uuid not null references words(id) on delete cascade,
  sentence_en text not null,
  sentence_zh text,
  sort_order int2 not null default 0
);

create index word_examples_word_id_idx on word_examples(word_id);

-- ============================================================
-- word_forms
-- ============================================================
create table word_forms (
  id uuid primary key default gen_random_uuid(),
  word_id uuid not null references words(id) on delete cascade,
  label text,
  form_text text not null,
  sort_order int2 not null default 0
);

create index word_forms_word_id_idx on word_forms(word_id);

-- ============================================================
-- user_word_progress (SRS)
-- ============================================================
create table user_word_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  word_id uuid not null references words(id) on delete cascade,
  box_level int2 not null default 0,
  ease_factor numeric not null default 2.5,
  next_review_at timestamptz not null default now(),
  last_reviewed_at timestamptz,
  correct_count int2 not null default 0,
  wrong_count int2 not null default 0,
  unique (user_id, word_id)
);

create index user_word_progress_user_word_idx on user_word_progress(user_id, word_id);
create index user_word_progress_next_review_idx on user_word_progress(user_id, next_review_at);

-- ============================================================
-- import_batches
-- ============================================================
create table import_batches (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references decks(id) on delete cascade,
  uploaded_by uuid not null references auth.users(id) on delete cascade,
  file_name text not null,
  status text not null default 'processing' check (status in ('processing', 'completed', 'failed')),
  total_rows int2 not null default 0,
  success_rows int2 not null default 0,
  error_rows int2 not null default 0,
  created_at timestamptz not null default now()
);

create index import_batches_deck_id_idx on import_batches(deck_id);
create index import_batches_uploaded_by_idx on import_batches(uploaded_by);

-- ============================================================
-- import_batch_errors
-- ============================================================
create table import_batch_errors (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references import_batches(id) on delete cascade,
  row_number int2 not null,
  error_message text not null,
  raw_data jsonb
);

create index import_batch_errors_batch_id_idx on import_batch_errors(batch_id);

-- ============================================================
-- updated_at auto-update trigger
-- ============================================================
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger decks_set_updated_at
  before update on decks
  for each row
  execute function set_updated_at();

create trigger words_set_updated_at
  before update on words
  for each row
  execute function set_updated_at();

-- ============================================================
-- RLS
-- ============================================================
alter table decks enable row level security;
alter table words enable row level security;
alter table word_distractors enable row level security;
alter table word_examples enable row level security;
alter table word_forms enable row level security;
alter table user_word_progress enable row level security;
alter table import_batches enable row level security;
alter table import_batch_errors enable row level security;

-- decks: owner only
create policy "decks_owner_all" on decks
  for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- words: via deck ownership
create policy "words_owner_all" on words
  for all
  using (exists (select 1 from decks d where d.id = words.deck_id and d.owner_id = auth.uid()))
  with check (exists (select 1 from decks d where d.id = words.deck_id and d.owner_id = auth.uid()));

-- word_distractors: via word -> deck ownership
create policy "word_distractors_owner_all" on word_distractors
  for all
  using (exists (
    select 1 from words w join decks d on d.id = w.deck_id
    where w.id = word_distractors.word_id and d.owner_id = auth.uid()
  ))
  with check (exists (
    select 1 from words w join decks d on d.id = w.deck_id
    where w.id = word_distractors.word_id and d.owner_id = auth.uid()
  ));

-- word_examples: via word -> deck ownership
create policy "word_examples_owner_all" on word_examples
  for all
  using (exists (
    select 1 from words w join decks d on d.id = w.deck_id
    where w.id = word_examples.word_id and d.owner_id = auth.uid()
  ))
  with check (exists (
    select 1 from words w join decks d on d.id = w.deck_id
    where w.id = word_examples.word_id and d.owner_id = auth.uid()
  ));

-- word_forms: via word -> deck ownership
create policy "word_forms_owner_all" on word_forms
  for all
  using (exists (
    select 1 from words w join decks d on d.id = w.deck_id
    where w.id = word_forms.word_id and d.owner_id = auth.uid()
  ))
  with check (exists (
    select 1 from words w join decks d on d.id = w.deck_id
    where w.id = word_forms.word_id and d.owner_id = auth.uid()
  ));

-- user_word_progress: user only sees own progress
create policy "user_word_progress_self_all" on user_word_progress
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- import_batches: uploader or deck owner
create policy "import_batches_owner_all" on import_batches
  for all
  using (
    uploaded_by = auth.uid()
    or exists (select 1 from decks d where d.id = import_batches.deck_id and d.owner_id = auth.uid())
  )
  with check (
    uploaded_by = auth.uid()
    or exists (select 1 from decks d where d.id = import_batches.deck_id and d.owner_id = auth.uid())
  );

-- import_batch_errors: via batch -> deck ownership or uploader
create policy "import_batch_errors_owner_all" on import_batch_errors
  for all
  using (exists (
    select 1 from import_batches b
    join decks d on d.id = b.deck_id
    where b.id = import_batch_errors.batch_id
      and (b.uploaded_by = auth.uid() or d.owner_id = auth.uid())
  ))
  with check (exists (
    select 1 from import_batches b
    join decks d on d.id = b.deck_id
    where b.id = import_batch_errors.batch_id
      and (b.uploaded_by = auth.uid() or d.owner_id = auth.uid())
  ));
