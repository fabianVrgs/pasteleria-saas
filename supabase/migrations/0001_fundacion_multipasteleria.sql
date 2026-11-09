-- =====================================================================
-- Fase 0 · Cimientos multi-pastelería
-- Cada pastelería (tenant) está aislada de las demás con Row Level Security.
-- Toda escritura sensible pasa por funciones (RPC) que validan permisos.
-- =====================================================================

-- ---------- Tipos ----------
create type public.member_role as enum ('owner', 'admin', 'vendedor', 'produccion');
create type public.bakery_plan as enum ('basico', 'plus');
create type public.subscription_status as enum ('trial', 'active', 'suspended');

-- Esquema privado: funciones de apoyo que NO se exponen por la API.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

-- ---------- Tablas ----------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '' check (char_length(full_name) <= 120),
  phone text check (char_length(phone) <= 30),
  created_at timestamptz not null default now()
);

create table public.platform_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.bakeries (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$'),
  logo_path text,
  primary_color text not null default '#7b3fa0' check (primary_color ~ '^#[0-9a-fA-F]{6}$'),
  secondary_color text not null default '#f4a7c3' check (secondary_color ~ '^#[0-9a-fA-F]{6}$'),
  plan public.bakery_plan not null default 'plus',
  status public.subscription_status not null default 'trial',
  trial_ends_at timestamptz not null default (now() + interval '15 days'),
  paid_until date,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index bakeries_created_by_idx on public.bakeries (created_by);

create table public.bakery_members (
  bakery_id uuid not null references public.bakeries (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  roles public.member_role[] not null check (cardinality(roles) > 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (bakery_id, user_id)
);
create index bakery_members_user_idx on public.bakery_members (user_id);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  bakery_id uuid not null references public.bakeries (id) on delete cascade,
  email text not null check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  roles public.member_role[] not null check (cardinality(roles) > 0),
  token text not null unique
    default (replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '')),
  invited_by uuid references auth.users (id) on delete set null,
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  accepted_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index invitations_bakery_idx on public.invitations (bakery_id);
create index invitations_invited_by_idx on public.invitations (invited_by);
create index invitations_accepted_by_idx on public.invitations (accepted_by);

-- ---------- Funciones de apoyo (privadas) ----------
create or replace function private.is_platform_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.platform_admins where user_id = (select auth.uid()));
$$;

-- ¿El usuario actual pertenece a la pastelería con alguno de estos roles?
-- El dueño (owner) pasa cualquier verificación de rol.
create or replace function private.has_bakery_role(p_bakery_id uuid, p_roles public.member_role[] default null)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.bakery_members m
    where m.bakery_id = p_bakery_id
      and m.user_id = (select auth.uid())
      and m.active
      and (p_roles is null or m.roles && p_roles or 'owner' = any (m.roles))
  );
$$;

-- ¿La suscripción permite crear o modificar datos? (si no, queda en solo lectura)
create or replace function private.bakery_is_writable(p_bakery_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.bakeries b
    where b.id = p_bakery_id
      and (
        (b.status = 'trial' and b.trial_ends_at > now())
        or (b.status = 'active' and (b.paid_until is null
             or b.paid_until >= (now() at time zone 'America/Bogota')::date))
      )
  );
$$;

-- ¿Comparto alguna pastelería con este usuario? (para ver nombres del equipo)
create or replace function private.shares_bakery_with(p_user_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.bakery_members a
    join public.bakery_members b on b.bakery_id = a.bakery_id
    where a.user_id = (select auth.uid()) and b.user_id = p_user_id
  );
$$;

revoke all on all functions in schema private from public, anon;
grant execute on all functions in schema private to authenticated;

-- ---------- Disparadores ----------
create or replace function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(left(new.raw_user_meta_data ->> 'full_name', 120), ''));
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function private.handle_new_user();

create or replace function private.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger bakeries_touch before update on public.bakeries
  for each row execute function private.touch_updated_at();

-- ---------- Seguridad a nivel de fila ----------
alter table public.profiles enable row level security;
alter table public.platform_admins enable row level security;
alter table public.bakeries enable row level security;
alter table public.bakery_members enable row level security;
alter table public.invitations enable row level security;

create policy "perfil propio o del mismo equipo" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or private.shares_bakery_with(id) or private.is_platform_admin());
create policy "editar perfil propio" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "ver mi registro de super-admin" on public.platform_admins for select to authenticated
  using (user_id = (select auth.uid()));

create policy "miembros ven su pastelería" on public.bakeries for select to authenticated
  using (private.has_bakery_role(id) or private.is_platform_admin());
create policy "dueño edita marca" on public.bakeries for update to authenticated
  using (private.has_bakery_role(id, '{owner}') and private.bakery_is_writable(id))
  with check (private.has_bakery_role(id, '{owner}'));

create policy "miembros ven su equipo" on public.bakery_members for select to authenticated
  using (private.has_bakery_role(bakery_id) or private.is_platform_admin());

create policy "dueño/admin ven invitaciones" on public.invitations for select to authenticated
  using (private.has_bakery_role(bakery_id, '{admin}'));
create policy "dueño/admin cancelan invitaciones" on public.invitations for delete to authenticated
  using (private.has_bakery_role(bakery_id, '{admin}') and accepted_at is null);

-- ---------- Permisos de tabla (mínimos) ----------
revoke all on public.profiles, public.platform_admins, public.bakeries,
  public.bakery_members, public.invitations from anon, authenticated;
grant select on public.profiles, public.platform_admins, public.bakeries,
  public.bakery_members, public.invitations to authenticated;
grant update (full_name, phone) on public.profiles to authenticated;
-- El dueño solo puede cambiar la marca; plan, estado y fechas los cambia el super-admin.
grant update (name, logo_path, primary_color, secondary_color) on public.bakeries to authenticated;
grant delete on public.invitations to authenticated;

-- =====================================================================
-- Funciones públicas (RPC)
-- =====================================================================

create or replace function private.normalize_slug(p_slug text)
returns text language sql immutable set search_path = '' as $$
  select lower(trim(p_slug));
$$;

create or replace function private.slug_is_reserved(p_slug text)
returns boolean language sql immutable set search_path = '' as $$
  select p_slug = any (array['www','app','admin','api','auth','login','ingresar','registro',
    'soporte','ayuda','blog','mail','static','assets','cdn','status','p','invitacion','inicio']);
$$;

create or replace function public.check_slug_available(p_slug text)
returns boolean language plpgsql stable security definer set search_path = '' as $$
declare v_slug text := private.normalize_slug(p_slug);
begin
  if v_slug !~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$' or private.slug_is_reserved(v_slug) then
    return false;
  end if;
  return not exists (select 1 from public.bakeries where slug = v_slug);
end;
$$;

-- Registro autónomo: crea la pastelería con 15 días de prueba y al usuario como dueño.
create or replace function public.create_bakery(p_name text, p_slug text)
returns public.bakeries language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_slug text := private.normalize_slug(p_slug);
  v_bakery public.bakeries;
begin
  if v_uid is null then
    raise exception 'Debes iniciar sesión.' using errcode = '42501';
  end if;
  if not private.is_platform_admin()
     and exists (select 1 from public.bakeries where created_by = v_uid) then
    raise exception 'Tu cuenta ya tiene una pastelería registrada.' using errcode = 'P0001';
  end if;
  if v_slug !~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$' then
    raise exception 'La dirección solo puede tener letras minúsculas, números y guiones (3 a 40 caracteres).' using errcode = 'P0001';
  end if;
  if private.slug_is_reserved(v_slug) then
    raise exception 'Esa dirección está reservada, elige otra.' using errcode = 'P0001';
  end if;

  begin
    insert into public.bakeries (name, slug, created_by)
    values (trim(p_name), v_slug, v_uid)
    returning * into v_bakery;
  exception when unique_violation then
    raise exception 'Esa dirección ya está en uso, elige otra.' using errcode = 'P0001';
  end;

  insert into public.bakery_members (bakery_id, user_id, roles)
  values (v_bakery.id, v_uid, '{owner}');

  return v_bakery;
end;
$$;

-- El dueño (o un admin, en plan Plus) invita a alguien del equipo. Devuelve el token del enlace.
create or replace function public.create_invitation(p_bakery_id uuid, p_email text, p_roles public.member_role[])
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_email text := lower(trim(p_email));
  v_plan public.bakery_plan;
  v_token text;
begin
  if not private.has_bakery_role(p_bakery_id, '{admin}') then
    raise exception 'No tienes permiso para invitar personas.' using errcode = '42501';
  end if;
  if not private.bakery_is_writable(p_bakery_id) then
    raise exception 'La suscripción está vencida: la cuenta está en modo solo lectura.' using errcode = 'P0001';
  end if;
  if p_roles is null or cardinality(p_roles) = 0 or 'owner' = any (p_roles) then
    raise exception 'Roles no válidos.' using errcode = 'P0001';
  end if;
  select plan into v_plan from public.bakeries where id = p_bakery_id;
  if 'admin' = any (p_roles) then
    if v_plan <> 'plus' then
      raise exception 'El rol administrador está disponible en el plan Plus.' using errcode = 'P0001';
    end if;
    if not private.has_bakery_role(p_bakery_id, '{owner}') then
      raise exception 'Solo el dueño puede invitar administradores.' using errcode = '42501';
    end if;
  end if;
  if exists (
    select 1 from public.bakery_members m join auth.users u on u.id = m.user_id
    where m.bakery_id = p_bakery_id and lower(u.email) = v_email
  ) then
    raise exception 'Esa persona ya hace parte del equipo.' using errcode = 'P0001';
  end if;

  delete from public.invitations
  where bakery_id = p_bakery_id and lower(email) = v_email and accepted_at is null;

  insert into public.invitations (bakery_id, email, roles, invited_by)
  values (p_bakery_id, v_email, p_roles, v_uid)
  returning token into v_token;
  return v_token;
end;
$$;

-- Datos públicos mínimos de una invitación (para mostrar "Te invitaron a X").
create or replace function public.get_invitation(p_token text)
returns table (bakery_name text, email text, roles public.member_role[], expired boolean, accepted boolean)
language sql stable security definer set search_path = '' as $$
  select b.name, i.email, i.roles, i.expires_at < now(), i.accepted_at is not null
  from public.invitations i join public.bakeries b on b.id = i.bakery_id
  where i.token = p_token;
$$;

create or replace function public.accept_invitation(p_token text)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_inv public.invitations;
  v_email text;
  v_slug text;
begin
  if v_uid is null then
    raise exception 'Debes iniciar sesión.' using errcode = '42501';
  end if;
  select * into v_inv from public.invitations where token = p_token for update;
  if not found then
    raise exception 'La invitación no existe.' using errcode = 'P0001';
  end if;
  if v_inv.accepted_at is not null then
    raise exception 'Esta invitación ya fue usada.' using errcode = 'P0001';
  end if;
  if v_inv.expires_at < now() then
    raise exception 'La invitación venció. Pide una nueva.' using errcode = 'P0001';
  end if;
  select lower(email) into v_email from auth.users where id = v_uid;
  if v_email is distinct from lower(v_inv.email) then
    raise exception 'Esta invitación es para %. Inicia sesión con ese correo.', v_inv.email using errcode = '42501';
  end if;

  insert into public.bakery_members (bakery_id, user_id, roles)
  values (v_inv.bakery_id, v_uid, v_inv.roles)
  on conflict (bakery_id, user_id) do update set roles = excluded.roles, active = true;

  update public.invitations set accepted_at = now(), accepted_by = v_uid where id = v_inv.id;
  select slug into v_slug from public.bakeries where id = v_inv.bakery_id;
  return v_slug;
end;
$$;

-- Cambiar roles o activar/desactivar a un miembro.
create or replace function public.update_member(p_bakery_id uuid, p_user_id uuid, p_roles public.member_role[], p_active boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_target public.bakery_members;
  v_is_owner boolean := private.has_bakery_role(p_bakery_id, '{owner}');
  v_plan public.bakery_plan;
begin
  if not private.has_bakery_role(p_bakery_id, '{admin}') then
    raise exception 'No tienes permiso para administrar el equipo.' using errcode = '42501';
  end if;
  if not private.bakery_is_writable(p_bakery_id) then
    raise exception 'La suscripción está vencida: la cuenta está en modo solo lectura.' using errcode = 'P0001';
  end if;
  select * into v_target from public.bakery_members where bakery_id = p_bakery_id and user_id = p_user_id;
  if not found then
    raise exception 'Esa persona no hace parte del equipo.' using errcode = 'P0001';
  end if;
  if 'owner' = any (v_target.roles) then
    raise exception 'No se puede modificar al dueño.' using errcode = '42501';
  end if;
  if p_roles is null or cardinality(p_roles) = 0 or 'owner' = any (p_roles) then
    raise exception 'Roles no válidos.' using errcode = 'P0001';
  end if;
  if ('admin' = any (p_roles) or 'admin' = any (v_target.roles)) and not v_is_owner then
    raise exception 'Solo el dueño puede gestionar administradores.' using errcode = '42501';
  end if;
  select plan into v_plan from public.bakeries where id = p_bakery_id;
  if 'admin' = any (p_roles) and v_plan <> 'plus' then
    raise exception 'El rol administrador está disponible en el plan Plus.' using errcode = 'P0001';
  end if;

  update public.bakery_members set roles = p_roles, active = coalesce(p_active, active)
  where bakery_id = p_bakery_id and user_id = p_user_id;
end;
$$;

create or replace function public.remove_member(p_bakery_id uuid, p_user_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_target public.bakery_members;
begin
  if not private.has_bakery_role(p_bakery_id, '{admin}') then
    raise exception 'No tienes permiso para administrar el equipo.' using errcode = '42501';
  end if;
  select * into v_target from public.bakery_members where bakery_id = p_bakery_id and user_id = p_user_id;
  if not found then return; end if;
  if 'owner' = any (v_target.roles) then
    raise exception 'No se puede quitar al dueño.' using errcode = '42501';
  end if;
  if 'admin' = any (v_target.roles) and not private.has_bakery_role(p_bakery_id, '{owner}') then
    raise exception 'Solo el dueño puede quitar administradores.' using errcode = '42501';
  end if;
  delete from public.bakery_members where bakery_id = p_bakery_id and user_id = p_user_id;
end;
$$;

-- ---------- Super-administrador (solo Fabian) ----------
create or replace function public.admin_list_bakeries()
returns table (id uuid, name text, slug text, plan public.bakery_plan, status public.subscription_status,
  trial_ends_at timestamptz, paid_until date, created_at timestamptz, owner_email text, members_count bigint)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_platform_admin() then
    raise exception 'Acceso denegado.' using errcode = '42501';
  end if;
  return query
    select b.id, b.name, b.slug, b.plan, b.status, b.trial_ends_at, b.paid_until, b.created_at,
      (select u.email::text from auth.users u where u.id = b.created_by),
      (select count(*) from public.bakery_members m where m.bakery_id = b.id)
    from public.bakeries b
    order by b.created_at desc;
end;
$$;

create or replace function public.admin_update_subscription(p_bakery_id uuid, p_plan public.bakery_plan,
  p_status public.subscription_status, p_paid_until date)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_platform_admin() then
    raise exception 'Acceso denegado.' using errcode = '42501';
  end if;
  update public.bakeries
  set plan = p_plan, status = p_status, paid_until = p_paid_until
  where id = p_bakery_id;
end;
$$;

-- Solo usuarios con sesión pueden llamar las funciones; get_invitation también sin sesión.
revoke all on function public.check_slug_available(text), public.create_bakery(text, text),
  public.create_invitation(uuid, text, public.member_role[]), public.get_invitation(text),
  public.accept_invitation(text), public.update_member(uuid, uuid, public.member_role[], boolean),
  public.remove_member(uuid, uuid), public.admin_list_bakeries(),
  public.admin_update_subscription(uuid, public.bakery_plan, public.subscription_status, date)
  from public, anon;
grant execute on function public.check_slug_available(text), public.create_bakery(text, text),
  public.create_invitation(uuid, text, public.member_role[]), public.get_invitation(text),
  public.accept_invitation(text), public.update_member(uuid, uuid, public.member_role[], boolean),
  public.remove_member(uuid, uuid), public.admin_list_bakeries(),
  public.admin_update_subscription(uuid, public.bakery_plan, public.subscription_status, date)
  to authenticated;
grant execute on function public.get_invitation(text) to anon;
revoke all on all functions in schema private from public, anon;
grant execute on all functions in schema private to authenticated;
