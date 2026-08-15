# TexERP Front - Login V1

Primera base limpia del frontend de **TexERP**, construida con Angular standalone.

## Incluye

- Login con formulario reactivo y validaciones.
- Manejo de errores HTTP de autenticación.
- `AuthService` para sesión.
- Interceptor para enviar `Authorization: Bearer <token>`.
- `authGuard` para proteger rutas privadas.
- `roleGuard` preparado para módulos con roles en futuras versiones.
- Página temporal de dashboard para validar el flujo completo de inicio/cierre de sesión.
- Página de acceso no autorizado.
- Configuración de API mediante `src/environments/environment.ts`.

## Ejecutar

```bash
npm ci
npm start
```

El frontend queda disponible normalmente en `http://localhost:4200` y el proxy reenvía `/api` hacia `http://localhost:8080`.

## Endpoint esperado

El login consume:

```text
POST /api/v1/auth/login
```

Body:

```json
{
  "email": "usuario@empresa.com",
  "password": "********"
}
```

Respuesta esperada:

```json
{
  "data": {
    "token": "jwt",
    "tokenType": "Bearer",
    "userId": 1,
    "name": "Usuario TexERP",
    "email": "usuario@empresa.com",
    "role": "ADMINISTRADOR"
  }
}
```

> Los guards del frontend mejoran navegación/UX, pero la autorización real debe validarse también en el backend.
