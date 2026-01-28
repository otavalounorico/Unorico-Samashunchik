# 🪦 Visor Cementerio - UNORICO SAMASHUNCHIK

Visor geográfico web para el Centro Sagrado Ancestral o Cementerio Indígena de Otavalo.

## 🚀 Tecnologías

- **Frontend:** React + Vite
- **Mapas:** OpenLayers + GeoServer (WMS/WFS)
- **Base de datos:** Supabase (PostgreSQL)
- **Estilos:** CSS-in-JS

## 📋 Requisitos Previos

- Node.js 18+
- GeoServer ejecutándose en `http://localhost:8080`
- Cuenta en Supabase con proyecto configurado

## ⚙️ Instalación

```bash
# Clonar el repositorio
git clone <url-del-repo>
cd visor-cementerio

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

## 🗄️ Base de Datos (Supabase)

### Configuración inicial

1. **Crear las tablas** (si no existen):
   - Abre Supabase Dashboard > SQL Editor
   - Ejecuta el archivo `supabase/schema.sql`

2. **Poblar con datos de prueba** (seeder):
   - Ejecuta el archivo `supabase/seed.sql`

### Estructura de tablas

| Tabla | Descripción |
|-------|-------------|
| `bloques_geom` | Bloques/sectores del cementerio |
| `nichos` | Nichos individuales (disponible/ocupado/reservado) |
| `fallecidos` | Datos de los difuntos |
| `fallecido_nicho` | Relación entre fallecidos y nichos |

### Scripts SQL disponibles

```
supabase/
├── schema.sql    # Crear tablas (ejecutar primero)
├── seed.sql      # Datos de prueba (seeder)
└── reset.sql     # Limpiar datos (⚠️ elimina todo)
```

## 🔧 Configuración

Edita `src/api/supabaseClient.js` con tus credenciales:

```javascript
const supabaseUrl = 'https://tu-proyecto.supabase.co';
const supabaseAnonKey = 'tu-anon-key';
```

## 📁 Estructura del Proyecto

```
src/
├── api/
│   └── supabaseClient.js    # Conexión a Supabase
├── components/
│   ├── mapa/
│   │   └── MapaCementerio.jsx   # Componente principal del mapa
│   └── ui/
│       ├── Sidebar.jsx      # Panel lateral con búsqueda y filtros
│       └── Buscador.jsx     # Buscador de difuntos
├── assets/
│   └── logo.png
├── App.jsx
└── main.jsx
```

## 🗺️ Capas GeoServer

El visor consume las siguientes capas WMS/WFS:

- `otavalo_cementerio:cementerio_general` - Límite general
- `otavalo_cementerio:infraestructura` - Infraestructura
- `otavalo_cementerio:bloques_geom` - Bloques del cementerio
- `otavalo_cementerio:nichos_geom` - Nichos individuales

## 📝 Licencia

Proyecto desarrollado para UNORICO SAMASHUNCHIK - Otavalo, Ecuador.
