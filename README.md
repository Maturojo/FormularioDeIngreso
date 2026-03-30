# Formulario de ingreso con cupones

Proyecto full stack con:

- React + Vite para el frontend.
- Node + Express para la API.
- Lowdb como base de datos embebida en archivo JSON.

## Funcionalidades

- Formulario de toma de datos.
- Generación automática de cupón único por registro.
- Validación de cupón por código.
- Canje del cupón con bloqueo posterior para evitar reutilización.
- Resumen básico de métricas y últimos cupones emitidos.

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- API: `http://localhost:4001`

En local, Vite redirige `/api` automáticamente al backend.

## Base de datos

La base de datos se crea automáticamente en:

`server/storage/data.json`

Si querés otra ubicación, podés definir la variable `DB_PATH`.

También podés inicializarla manualmente con:

```bash
npm run db:init
```

En Vercel preview, la base se guarda temporalmente en `/tmp`, así que sirve para pruebas pero no como persistencia definitiva.
