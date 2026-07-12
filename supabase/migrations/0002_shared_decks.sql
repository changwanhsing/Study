-- 添加共享卡組功能
-- 時間戳: 2026-07-12

-- ============================================================
-- deck_collaborators 表
-- ============================================================
create table deck_collaborators (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references decks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'viewer' check (role in ('viewer', 'editor')),
  invited_at timestamptz not null default now(),

  unique(deck_id, user_id)
);

create index deck_collaborators_deck_idx on deck_collaborators(deck_id);
create index deck_collaborators_user_idx on deck_collaborators(user_id);

-- ============================================================
-- deck_invitations 表
-- ============================================================
create table deck_invitations (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references decks(id) on delete cascade,
  invited_email text not null,
  invited_by uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'expired')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz,

  unique(deck_id, invited_email, status)
);

create index deck_invitations_deck_idx on deck_invitations(deck_id);
create index deck_invitations_email_idx on deck_invitations(invited_email);
create index deck_invitations_status_idx on deck_invitations(status);

-- ============================================================
-- RLS 策略
-- ============================================================

-- deck_collaborators: 卡組擁有者或合作者可以訪問
alter table deck_collaborators enable row level security;

create policy "deck_collaborators_owner" on deck_collaborators
  for all
  using (
    exists (
      select 1 from decks d
      where d.id = deck_id and d.owner_id = auth.uid()
    )
  );

create policy "deck_collaborators_self" on deck_collaborators
  for select
  using (user_id = auth.uid());

-- deck_invitations: 卡組擁有者或被邀請者可以訪問
alter table deck_invitations enable row level security;

create policy "deck_invitations_owner" on deck_invitations
  for all
  using (
    exists (
      select 1 from decks d
      where d.id = deck_id and d.owner_id = auth.uid()
    )
  );

create policy "deck_invitations_recipient" on deck_invitations
  for select
  using (
    invited_email = (
      select email from auth.users where id = auth.uid()
    )
  );

-- 更新 decks RLS 策略以包括合作者
-- (原有的 owner-only 策略保持不變，新增讀取權限給合作者)
create policy "decks_collaborator_read" on decks
  for select
  using (
    exists (
      select 1 from deck_collaborators dc
      where dc.deck_id = id and dc.user_id = auth.uid()
    )
  );

-- 更新 words RLS 策略允許合作者訪問
create policy "words_collaborator_read" on words
  for select
  using (
    exists (
      select 1 from decks d
      join deck_collaborators dc on d.id = dc.deck_id
      where d.id = deck_id and dc.user_id = auth.uid()
    )
  );

-- 合作者可以插入/更新自己卡組的單字（如果是 editor）
create policy "words_collaborator_write" on words
  for update
  using (
    exists (
      select 1 from decks d
      join deck_collaborators dc on d.id = dc.deck_id
      where d.id = deck_id
        and dc.user_id = auth.uid()
        and dc.role = 'editor'
    )
  )
  with check (
    exists (
      select 1 from decks d
      join deck_collaborators dc on d.id = dc.deck_id
      where d.id = deck_id
        and dc.user_id = auth.uid()
        and dc.role = 'editor'
    )
  );

-- ============================================================
-- 觸發器：自動過期的邀請
-- ============================================================
create or replace function expire_old_invitations()
returns trigger
language plpgsql
as $$
begin
  update deck_invitations
  set status = 'expired'
  where status = 'pending' and expires_at < now();

  return null;
end;
$$;

-- 每次查詢邀請時檢查過期
create or replace function check_invitation_expiry()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'pending' and new.expires_at < now() then
    new.status = 'expired';
  end if;
  return new;
end;
$$;

create trigger check_invitation_expiry_before_update
  before update on deck_invitations
  for each row
  execute function check_invitation_expiry();

-- ============================================================
-- 註釋
-- ============================================================
comment on table deck_collaborators is '卡組合作者，允許多個用戶共享編輯卡組';
comment on column deck_collaborators.role is 'viewer (只讀) 或 editor (可編輯)';

comment on table deck_invitations is '卡組邀請，待接受的邀請';
comment on column deck_invitations.status is 'pending, accepted, declined, 或 expired';
