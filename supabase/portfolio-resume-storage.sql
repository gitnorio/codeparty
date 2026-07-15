insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portfolio-resumes',
  'portfolio-resumes',
  true,
  512000,
  array['application/pdf']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Portfolio resumes are public" on storage.objects;
create policy "Portfolio resumes are public"
on storage.objects
for select
to public
using (bucket_id = 'portfolio-resumes');

drop policy if exists "Users can upload own portfolio resume" on storage.objects;
create policy "Users can upload own portfolio resume"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'portfolio-resumes'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Users can update own portfolio resume" on storage.objects;
create policy "Users can update own portfolio resume"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'portfolio-resumes'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'portfolio-resumes'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Users can delete own portfolio resume" on storage.objects;
create policy "Users can delete own portfolio resume"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'portfolio-resumes'
  and auth.uid()::text = (storage.foldername(name))[1]
);
