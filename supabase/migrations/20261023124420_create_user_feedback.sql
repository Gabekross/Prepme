create table public.user_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('general', 'technical', 'complaint', 'accessibility', 'suggestion', 'post_exam')),
  message text,
  overall_rating smallint check (overall_rating between 1 and 5),
  question_quality_rating smallint check (question_quality_rating between 1 and 5),
  explanation_helpfulness_rating smallint check (explanation_helpfulness_rating between 1 and 5),
  page_path text not null,
  attempt_id text,
  bank_slug text,
  set_id text,
  device_type text not null default 'unknown' check (device_type in ('mobile', 'tablet', 'desktop', 'unknown')),
  allow_contact boolean not null default false,
  status text not null default 'new' check (status in ('new', 'reviewing', 'planned', 'resolved', 'closed')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  admin_notes text,
  assigned_to uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_feedback_message_length check (message is null or char_length(message) between 1 and 4000),
  constraint user_feedback_page_path_length check (char_length(page_path) between 1 and 500),
  constraint user_feedback_content check (
    (kind = 'post_exam' and overall_rating is not null and question_quality_rating is not null and explanation_helpfulness_rating is not null)
    or (kind <> 'post_exam' and message is not null)
  )
);

create index user_feedback_created_at_idx on public.user_feedback (created_at desc);
create index user_feedback_status_idx on public.user_feedback (status, created_at desc);
create index user_feedback_user_id_idx on public.user_feedback (user_id, created_at desc);
create unique index user_feedback_post_exam_attempt_unique
  on public.user_feedback (user_id, attempt_id)
  where kind = 'post_exam' and attempt_id is not null;

alter table public.user_feedback enable row level security;

revoke all on table public.user_feedback from anon, authenticated;
grant insert on table public.user_feedback to authenticated;

create policy "Users can submit their own feedback"
  on public.user_feedback
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

comment on table public.user_feedback is 'User experience feedback and optional post-exam survey responses.';
