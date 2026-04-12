# Rumbo Norte Real Estate — Proyecto
 
## Resumen
Web inmobiliaria para **Rumbo Norte Real Estate**, inmobiliaria familiar en Alcorcón, Madrid.
Sitio estático (HTML/CSS/JS vanilla) con backend Supabase para gestión de inmuebles.

## Stack tecnológico
- **Frontend**: HTML5, CSS3 (custom properties), JavaScript ES6+ (sin frameworks)
- **Backend**: Supabase (Auth, Database PostgreSQL, Storage)
- **Fonts**: Inter (body) + Playfair Display (headings) via Google Fonts
- **Deploy**: Sitio estático, cualquier hosting sirve (Netlify, Vercel, hosting tradicional)

## Estructura de archivos

```
├── index.html                 # Landing page principal
├── inmuebles.html             # Listado público con buscador y filtros
├── inmueble.html              # Detalle de inmueble (?id=UUID)
├── inmuebles.js               # Lógica de listado público (filtros, paginación)
├── inmueble.js                # Lógica de detalle (galería, lightbox)
├── inmuebles.css              # Estilos de listado y detalle
├── supabase-config.js         # Configuración cliente Supabase (URL + anon key)
├── supabase-setup.sql         # SQL para crear tabla, RLS, triggers en Supabase
├── style.css                  # Estilos globales (header, hero, servicios, contacto, footer)
├── servicio.css               # Estilos de páginas de servicio
├── main.js                    # JS global (header scroll, hamburger, form, animations)
├── web/
│   ├── login.html             # Login admin (no enlazado desde la web pública)
│   ├── admin.html             # Panel de administración de inmuebles
│   ├── auth.js                # Lógica de autenticación (login/logout/guard)
│   ├── admin.js               # CRUD de inmuebles (crear, editar, eliminar, estado, visibilidad)
│   └── admin.css              # Estilos del panel admin y login
├── servicio-compraventa.html  # Servicio: compraventa
├── servicio-alquiler.html     # Servicio: alquiler
├── servicio-valoraciones.html # Servicio: valoraciones
├── servicio-asesoria-legal.html # Servicio: asesoría legal
├── servicio-financiacion.html # Servicio: financiación
├── servicio-locales.html      # Servicio: locales y oficinas
├── aviso-legal.html           # Aviso legal
├── politica-privacidad.html   # Política de privacidad
├── politica-cookies.html      # Política de cookies
└── images/                    # Recursos estáticos (logos)
```

## Base de datos (Supabase)

### Tabla `properties`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | PK, auto-generado |
| title | TEXT | Título del inmueble |
| description | TEXT | Descripción larga |
| property_type | TEXT | piso, casa, atico, duplex, estudio, local, oficina, garaje, terreno |
| operation | TEXT | venta, alquiler |
| price | NUMERIC | Precio en euros |
| zone | TEXT | Zona (ej: "Alcorcón centro") |
| address | TEXT | Dirección completa (opcional) |
| bedrooms | INTEGER | Número de habitaciones |
| bathrooms | INTEGER | Número de baños |
| sqm | NUMERIC | Metros cuadrados |
| floor | TEXT | Planta (ej: "3ª", "Bajo") |
| has_elevator | BOOLEAN | Ascensor |
| has_garage | BOOLEAN | Garaje |
| has_terrace | BOOLEAN | Terraza |
| has_pool | BOOLEAN | Piscina |
| has_ac | BOOLEAN | Aire acondicionado |
| has_storage | BOOLEAN | Trastero |
| energy_rating | TEXT | Certificación energética (A-G) |
| images | TEXT[] | Array de URLs de imágenes (la primera es portada) |
| status | TEXT | published, sold, rented |
| is_visible | BOOLEAN | Visible para clientes |

### RLS (Row Level Security)
- **Público**: solo lectura de inmuebles con `is_visible = true`
- **Autenticado**: acceso completo (CRUD)

### Storage
- Bucket: `property-images` (público para lectura)
- Uploads solo para usuarios autenticados

## Autenticación
- Login en `/web/login.html` (sin enlace visible en la web pública)
- Solo email/password, cuentas creadas manualmente en Supabase Dashboard
- Guard en `/web/admin.html`: redirige a login si no está autenticado

## CSS Variables (Design System)
```css
--color-primary: #1a2e44     /* Azul oscuro */
--color-primary-light: #2a4a6b
--color-accent: #c4973a      /* Dorado */
--color-bg: #ffffff
--color-surface: #f7f7f7
--color-text: #1a1a1a
--color-text-light: #717171
--color-border: #e5e5e5
--radius: 8px
--shadow-sm / --shadow-md
--transition: 0.25s ease
--header-height: 64px (72px desktop)
```

## Rutas principales
| URL | Descripción | Acceso |
|-----|-------------|--------|
| `/` | Landing page | Público |
| `/inmuebles.html` | Buscador de inmuebles | Público |
| `/inmueble.html?id=X` | Detalle de inmueble | Público |
| `/web/login.html` | Login admin | Oculto |
| `/web/admin.html` | Panel admin | Autenticado |

## Contacto de la empresa
- Teléfono: +34 652 39 25 93
- Instagram: @rumbo_norte_real_estate
- Dirección: C. Porto Lagos 9, posterior, LOCAL 4, 28924 Alcorcón, Madrid
- Horario: Lun-Vie 9:00-20:30, Sáb-Dom cerrado

## Pasos para desplegar
1. Crear proyecto en Supabase (https://supabase.com)
2. Ejecutar `supabase-setup.sql` en SQL Editor de Supabase
3. Crear bucket `property-images` en Storage (público)
4. Crear usuario admin en Authentication > Users
5. Copiar la URL y anon key del proyecto Supabase en `supabase-config.js`
6. Subir todos los archivos a tu hosting
