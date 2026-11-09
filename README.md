# Pedidos Pastelería (nombre provisional)

Sistema para pastelerías: centraliza los pedidos y conecta a quien vende con quien prepara.
Es un producto **multi-pastelería**: una sola aplicación donde cada pastelería se registra sola
y sus datos quedan aislados de las demás.

- **Frontend y servidor:** Next.js 16 (App Router) + Tailwind CSS 4
- **Base de datos, inicio de sesión y archivos:** Supabase (PostgreSQL)
- **Primera pastelería:** Gelatortas Zaritha

---

## Guía de la Fase 0: los cimientos

### 1. La idea central: "multi-tenant"

Una sola base de datos guarda la información de **todas** las pastelerías. Cada fila importante tiene
la columna `bakery_id`, que dice a qué pastelería pertenece. Para que una pastelería **nunca** vea los datos
de otra, no confiamos en que la app filtre bien: la propia base de datos lo impide con
**Row Level Security (RLS)**.

RLS son reglas escritas en SQL que PostgreSQL revisa en cada consulta. Por ejemplo:

```sql
create policy "miembros ven su pastelería" on public.bakeries for select
  using (private.has_bakery_role(id) or private.is_platform_admin());
```

Esto se lee: *"solo puedes ver una fila de `bakeries` si eres miembro de esa pastelería o eres el super-admin"*.
Aunque alguien modifique la app o llame directamente a la API, la base de datos responde con cero filas.

### 2. Las tablas

| Tabla | Para qué sirve |
|---|---|
| `bakeries` | Cada pastelería: nombre, dirección (`slug`), colores, plan, estado de la suscripción |
| `bakery_members` | Quién pertenece a qué pastelería y con qué roles |
| `invitations` | Invitaciones pendientes para unirse a un equipo |
| `profiles` | Nombre y teléfono de cada usuario |
| `platform_admins` | Quién es super-administrador (solo tú) |

Los usuarios en sí (correo y contraseña) los guarda Supabase Auth en `auth.users`; la contraseña nunca
pasa por nuestro código.

### 3. Roles

| Rol | Qué puede hacer |
|---|---|
| **Dueño** (`owner`) | Todo. Lo recibe automáticamente quien crea la pastelería |
| **Administrador** (`admin`) | Gestionar equipo y, más adelante, reportes. Solo en plan **Plus** |
| **Vendedor** (`vendedor`) | Registrar pedidos y ventas de vitrina (Fase 2 y 4) |
| **Producción** (`produccion`) | Tablero de producción y calendario (Fase 3) |

Una persona puede tener varios roles a la vez.

### 4. Cómo se registra una pastelería (sin que tú hagas nada)

1. La persona se registra en `/registro` y confirma su correo.
2. En `/crear-pasteleria` escribe el nombre; la dirección se genera sola (`Gelatortas Zaritha` → `gelatortas-zaritha`).
3. La función `create_bakery` crea la pastelería con **15 días de prueba (con todo el Plus)** y la deja como dueña.
4. Desde **Equipo** invita a sus vendedores y pasteleras: se genera un enlace que se envía por WhatsApp.
   Cada persona crea su cuenta **con el mismo correo** de la invitación y queda dentro.

Reglas de seguridad que aplica la base de datos:
- Una cuenta solo puede crear **una** pastelería (evita abusos de la prueba gratis).
- Una invitación solo funciona para el correo al que se envió, una sola vez y durante 7 días.
- Nadie puede cambiarse a sí mismo el plan, el estado ni la fecha de pago: esas columnas no se pueden
  editar desde la app (solo tú, con las funciones `admin_*`).

### 5. Suscripción y modo solo lectura

| Estado | Qué significa |
|---|---|
| `trial` | En prueba hasta `trial_ends_at` |
| `active` | Pagando, válido hasta `paid_until` |
| `suspended` | Suspendida manualmente |

Cuando la prueba termina o vence `paid_until`, la función `private.bakery_is_writable` devuelve *falso* y la
pastelería queda en **solo lectura**: ve sus datos pero no puede crear ni modificar nada. Las tablas de
pedidos (Fase 2) usarán esta misma función en sus reglas.

### 6. Tu panel de super-administrador (`/admin`)

- Ves todas las pastelerías, quién es el dueño, cuántas personas tiene y en qué estado está.
- **Registrar pago:** eliges plan y meses; la fecha de vencimiento se extiende sola.
- **Edición manual:** cambiar plan, estado o fecha (por ejemplo, suspender).

### 7. Cómo fluye una petición

```
Navegador ──► src/proxy.ts ──► página (Server Component) ──► Supabase (con RLS)
               │                 │
               │                 └─ src/lib/auth.ts: ¿quién es? ¿qué roles tiene aquí?
               └─ renueva la sesión y manda a /ingresar si la página es privada
```

- **Server Components** (`page.tsx`): leen datos en el servidor; el navegador recibe HTML ya armado.
- **Server Actions** (`actions.ts`, con `"use server"`): guardan cambios cuando se envía un formulario.
- **Client Components** (`"use client"`): solo para lo interactivo (formularios, botones de copiar, colores).
- Las páginas que dependen del usuario están dentro de `<Suspense>`: es el patrón que pide Next.js 16
  con *Cache Components* (lo estático se muestra al instante y lo personal llega después).

### 8. Mapa de archivos

```
supabase/migrations/0001_fundacion_multipasteleria.sql   ← toda la base de datos y su seguridad
src/proxy.ts                         ← sesión y protección de rutas
src/lib/supabase/server.ts|client.ts ← clientes de Supabase
src/lib/auth.ts                      ← quién es el usuario, a qué pastelería pertenece
src/lib/roles.ts, subscription.ts    ← nombres de roles y reglas de la suscripción
src/components/ui.tsx                ← botones, campos, tarjetas
src/app/(auth)/                      ← ingresar, registro, recuperar contraseña
src/app/crear-pasteleria/            ← registro de pastelería nueva
src/app/inicio/                      ← a qué pastelería entrar
src/app/p/[slug]/                    ← la app de cada pastelería (inicio, equipo, marca)
src/app/invitacion/[token]/          ← aceptar invitación
src/app/admin/                       ← tu panel de super-administrador
```

---

## Cómo correrlo en tu computador

Necesitas Node.js 20 o superior.

```bash
git clone https://github.com/fabianVrgs/pasteleria-saas.git
cd pasteleria-saas
npm install
cp .env.example .env.local   # y pega la URL y la clave publishable de Supabase
npm run dev
```

Abre http://localhost:3000.

### Hacerte super-administrador

Regístrate en la app con tu correo y luego ejecuta en Supabase → SQL Editor:

```sql
insert into public.platform_admins (user_id)
select id from auth.users where email = 'TU_CORREO@ejemplo.com';
```

### Configuración pendiente en Supabase (antes de publicar)

1. **Authentication → URL Configuration:** poner el dominio real como *Site URL* y agregar
   `https://TU-DOMINIO/auth/callback` (y `http://localhost:3000/auth/callback`) en *Redirect URLs*.
2. **Correo:** el servicio de correo incluido en Supabase solo envía a los miembros de tu organización
   de Supabase y con un límite muy bajo por hora. Para que otras pastelerías reciban la confirmación,
   hay que conectar un SMTP propio (por ejemplo, Resend) en **Authentication → Emails → SMTP Settings**.

## Pruebas de seguridad

Se probó directamente en la base de datos, con dos pastelerías y tres usuarios de prueba, que:

- una pastelería no puede ver, editar ni invitar en otra;
- nadie puede activarse la suscripción a sí mismo ni crear una segunda pastelería;
- una invitación no la puede usar otra persona ni reutilizarse;
- la vendedora no puede cambiar la marca, invitar ni quitar a la dueña;
- con la prueba vencida se puede consultar pero no modificar;
- un visitante sin sesión no puede leer nada.

## Fases

| Fase | Contenido | Estado |
|---|---|---|
| 0 | Cimientos multi-pastelería, registro, equipo, super-admin | ✅ |
| 1 | Catálogo: productos, categorías, opciones; importar los 89 productos de Zaritha | Siguiente |
| 2 | Pedidos: cliente, canal, opciones, fotos, anticipo y comprobante, domicilio | |
| 3 | Producción por días, calendario, estados, cambios y devoluciones | |
| 4 | Vitrina: entradas, ventas rápidas, stock | |
| 5 | Logo, subdominios, dominio propio | |
| 6 | Plus: tiempo real, sonido y notificaciones, administrador, reportes | |
| 7 | Piloto en Zaritha y lanzamiento | |
