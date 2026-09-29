-- PayTrack SME — final defence migration
-- Adds case-study organisation signup, staff roles and payment staff interaction tracking.
-- Run ONCE in Supabase SQL Editor before deploying the matching frontend files.

begin;

-- 1) Staff attribution on payment records.
alter table public.transactions
  add column if not exists created_by uuid references auth.users(id) on delete set null;

alter table public.reconciliations
  add column if not exists created_by uuid references auth.users(id) on delete set null;

-- 2) New signups are attached to one of the TWO existing case-study organisations.
-- The trigger is deliberately named zz_* so it runs after older auth-user triggers.
create or replace function public.assign_case_study_organisation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_org_id uuid;
begin
  v_code := upper(coalesce(new.raw_user_meta_data ->> 'organisation_code',''));
  if v_code not in ('AS5','SABALI') then
    return new;
  end if;

  select id into v_org_id
  from public.organisations
  where upper(code) = v_code
  limit 1;

  if v_org_id is null then
    raise exception 'Case-study organisation % was not found. Ensure AS5 and SABALI exist first.', v_code;
  end if;

  -- Keep the new account tied to the organisation explicitly selected at signup.
  delete from public.user_organisations
  where user_id = new.id
    and organisation_id <> v_org_id;

  if not exists (
    select 1 from public.user_organisations
    where user_id = new.id and organisation_id = v_org_id
  ) then
    insert into public.user_organisations (user_id, organisation_id, organisation_role)
    values (new.id, v_org_id, 'staff');
  end if;

  return new;
end;
$$;

drop trigger if exists zz_paytrack_case_org_signup on auth.users;
create trigger zz_paytrack_case_org_signup
after insert on auth.users
for each row execute function public.assign_case_study_organisation();

-- 3) Staff directory. Only members of the organisation can read it.
create or replace function public.get_org_staff(p_organisation_id uuid)
returns table (
  user_id uuid,
  full_name text,
  email text,
  organisation_role text
)
language sql
security definer
set search_path = public, auth
as $$
  select
    u.id,
    coalesce(u.raw_user_meta_data ->> 'full_name', split_part(u.email,'@',1))::text,
    u.email::text,
    uo.organisation_role::text
  from public.user_organisations uo
  join auth.users u on u.id = uo.user_id
  where uo.organisation_id = p_organisation_id
    and exists (
      select 1 from public.user_organisations mine
      where mine.user_id = auth.uid()
        and mine.organisation_id = p_organisation_id
    )
  order by coalesce(u.raw_user_meta_data ->> 'full_name', u.email);
$$;

-- 4) Admin-only role changes. Prevents a user changing their own role accidentally.
create or replace function public.set_org_staff_role(
  p_organisation_id uuid,
  p_user_id uuid,
  p_role text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_my_role text;
begin
  select lower(organisation_role::text) into v_my_role
  from public.user_organisations
  where user_id = auth.uid() and organisation_id = p_organisation_id
  limit 1;

  if v_my_role not in ('admin','administrator') then
    raise exception 'Only an organisation administrator can change staff roles.';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'You cannot change your own role from this screen.';
  end if;
  if lower(p_role) not in ('admin','staff') then
    raise exception 'Role must be admin or staff.';
  end if;

  update public.user_organisations
  set organisation_role = lower(p_role)
  where user_id = p_user_id and organisation_id = p_organisation_id;
end;
$$;

-- 5) Payment staff interaction history for the transaction detail page.
create or replace function public.get_transaction_staff_activity(p_transaction_id uuid)
returns table (
  action_type text,
  staff_name text,
  staff_email text,
  action_at timestamptz
)
language sql
security definer
set search_path = public, auth
as $$
  with target as (
    select t.id, t.organisation_id, t.created_by, t.created_at
    from public.transactions t
    where t.id = p_transaction_id
      and exists (
        select 1 from public.user_organisations mine
        where mine.user_id = auth.uid()
          and mine.organisation_id = t.organisation_id
      )
  ), activity as (
    select
      'recorded'::text as action_type,
      t.created_by as staff_id,
      t.created_at as action_at
    from target t
    where t.created_by is not null
    union all
    select
      'reconciled'::text,
      r.created_by,
      coalesce(r.created_at, r.verification_date::timestamptz)
    from public.reconciliations r
    join target t on t.id = r.transaction_id
    where r.created_by is not null
  )
  select
    a.action_type,
    coalesce(u.raw_user_meta_data ->> 'full_name', split_part(u.email,'@',1))::text,
    u.email::text,
    a.action_at
  from activity a
  left join auth.users u on u.id = a.staff_id
  order by a.action_at asc;
$$;

grant execute on function public.get_org_staff(uuid) to authenticated;
grant execute on function public.set_org_staff_role(uuid,uuid,text) to authenticated;
grant execute on function public.get_transaction_staff_activity(uuid) to authenticated;

commit;

-- Verification: these should return AS5 Group and Sabali Limited.
select id, name, code from public.organisations where upper(code) in ('AS5','SABALI') order by code;
