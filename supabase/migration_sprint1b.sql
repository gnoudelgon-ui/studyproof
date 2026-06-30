-- Sprint 1B Migration - Practice Mode
-- Paste this into Supabase SQL editor after Sprint 1A migration.

create extension if not exists "uuid-ossp";

create table if not exists quizzes (
  id uuid primary key default uuid_generate_v4(),
  document_id uuid not null references documents(id) on delete cascade,
  questions jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists quiz_attempts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null,
  document_id uuid not null references documents(id) on delete cascade,
  answers jsonb not null,
  score int not null,
  created_at timestamptz not null default now()
);

create table if not exists mistakes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null,
  document_id uuid not null references documents(id) on delete cascade,
  source text not null,
  content text not null,
  correct_answer text,
  times_wrong int not null default 1,
  last_seen timestamptz not null default now()
);