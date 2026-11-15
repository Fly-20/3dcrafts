-- The conversation with a customer, one row per message, under the project
-- it's about (brief §10 "messages"). Additive only.
--
--   in   what the customer wrote (pasted in by the owner)
--   out  what the owner sent back (saved when they mark a draft as sent)
--   note something only the owner sees, e.g. "Ordered the £1 quote listing"
--
-- The assistant's latest read of the conversation and its draft reply are
-- kept in projects.specs, so no other table is needed.

create table messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  direction text not null check (direction in ('in', 'out', 'note')),
  body text not null,
  created_by uuid references admin_users(id),
  created_at timestamptz not null default now()
);
create index messages_project_id_idx on messages (project_id, created_at);

alter table messages enable row level security;
create policy "Admins can manage messages" on messages for all using (is_admin()) with check (is_admin());
grant select, insert, update, delete on messages to authenticated;

-- Existing enquiries: their pasted message becomes the first message.
insert into messages (project_id, direction, body, created_at)
select id, 'in', enquiry_text, created_at from projects;
