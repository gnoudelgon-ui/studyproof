-- Sprint 1D Migration - Auth RLS Policies
-- Paste this into Supabase SQL editor after Sprint 1B migration.

alter table documents enable row level security;
alter table learning_blocks enable row level security;
alter table quizzes enable row level security;
alter table quiz_attempts enable row level security;
alter table mistakes enable row level security;

-- Reset app policies so this migration can be rerun safely.
drop policy if exists "Users can manage own documents" on documents;
drop policy if exists "Users can manage own learning blocks" on learning_blocks;
drop policy if exists "Users can manage own quizzes" on quizzes;
drop policy if exists "Users can manage own quiz attempts" on quiz_attempts;
drop policy if exists "Users can manage own mistakes" on mistakes;

drop policy if exists "Service role full access to documents" on documents;
drop policy if exists "Service role full access to learning_blocks" on learning_blocks;
drop policy if exists "Service role full access to quizzes" on quizzes;
drop policy if exists "Service role full access to quiz_attempts" on quiz_attempts;
drop policy if exists "Service role full access to mistakes" on mistakes;

create policy "Users can manage own documents"
  on documents for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage own learning blocks"
  on learning_blocks for all
  to authenticated
  using (
    exists (
      select 1 from documents
      where documents.id = learning_blocks.document_id
        and documents.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from documents
      where documents.id = learning_blocks.document_id
        and documents.user_id = auth.uid()
    )
  );

create policy "Users can manage own quizzes"
  on quizzes for all
  to authenticated
  using (
    exists (
      select 1 from documents
      where documents.id = quizzes.document_id
        and documents.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from documents
      where documents.id = quizzes.document_id
        and documents.user_id = auth.uid()
    )
  );

create policy "Users can manage own quiz attempts"
  on quiz_attempts for all
  to authenticated
  using (
    auth.uid() = user_id
    and exists (
      select 1 from documents
      where documents.id = quiz_attempts.document_id
        and documents.user_id = auth.uid()
    )
  )
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from documents
      where documents.id = quiz_attempts.document_id
        and documents.user_id = auth.uid()
    )
  );

create policy "Users can manage own mistakes"
  on mistakes for all
  to authenticated
  using (
    auth.uid() = user_id
    and exists (
      select 1 from documents
      where documents.id = mistakes.document_id
        and documents.user_id = auth.uid()
    )
  )
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from documents
      where documents.id = mistakes.document_id
        and documents.user_id = auth.uid()
    )
  );

-- Keep service role access for server API routes that use createAdminClient().
create policy "Service role full access to documents"
  on documents for all
  to service_role using (true) with check (true);

create policy "Service role full access to learning_blocks"
  on learning_blocks for all
  to service_role using (true) with check (true);

create policy "Service role full access to quizzes"
  on quizzes for all
  to service_role using (true) with check (true);

create policy "Service role full access to quiz_attempts"
  on quiz_attempts for all
  to service_role using (true) with check (true);

create policy "Service role full access to mistakes"
  on mistakes for all
  to service_role using (true) with check (true);