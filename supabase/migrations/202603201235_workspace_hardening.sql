drop policy if exists "Users can manage own profile" on public.users;

create policy "Organization members can view workspace users"
on public.users
for select
using (
  exists (
    select 1
    from public.users as workspace_member
    where workspace_member.id = auth.uid()
      and workspace_member.organization_id = users.organization_id
  )
);

create policy "Users can insert own profile"
on public.users
for insert
with check (auth.uid() = id);

create policy "Users can update own profile"
on public.users
for update
using (auth.uid() = id)
with check (auth.uid() = id);

create or replace function public.set_workspace_member_role(target_member_id uuid, next_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_org_id uuid;
  current_role text;
begin
  if next_role not in ('manager', 'rep') then
    raise exception 'Invalid role';
  end if;

  select organization_id, role
  into current_org_id, current_role
  from public.users
  where id = auth.uid();

  if current_org_id is null or current_role <> 'manager' then
    raise exception 'Only managers can update workspace member roles';
  end if;

  if not exists (
    select 1
    from public.users
    where id = target_member_id
      and organization_id = current_org_id
  ) then
    raise exception 'Target member is not in your workspace';
  end if;

  update public.users
  set role = next_role
  where id = target_member_id;
end;
$$;

revoke all on function public.set_workspace_member_role(uuid, text) from public;
grant execute on function public.set_workspace_member_role(uuid, text) to authenticated;
