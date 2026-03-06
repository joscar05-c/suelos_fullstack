# 🔥 Configuración de Firebase

## Backend (NestJS)

### 1. Obtener Service Account de Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto o crea uno nuevo
3. Ve a **Configuración del proyecto** (⚙️) → **Cuentas de servicio**
4. Haz clic en **Generar nueva clave privada**
5. Descarga el archivo JSON
6. **Reemplaza** el contenido de `backend-suelos/firebase-service-account.json` con el JSON descargado

### 2. Configurar Phone Auth en Firebase Console

1. En Firebase Console, ve a **Authentication** → **Sign-in method**
2. Habilita **Número de teléfono**
3. Configura los dominios autorizados (añade `localhost` para desarrollo)

## Frontend (Ionic/Angular)

### 1. Configuración de Firebase Web

1. En Firebase Console → **Configuración del proyecto** → **Aplicaciones**
2. Haz clic en el ícono web `</>`
3. Registra tu app
4. Copia las credenciales de configuración

### 2. Actualizar environment.ts

Actualiza `frontend-suelos/src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
  firebase: {
    apiKey: "TU_API_KEY",
    authDomain: "TU_PROJECT.firebaseapp.com",
    projectId: "TU_PROJECT_ID",
    storageBucket: "TU_PROJECT.appspot.com",
    messagingSenderId: "TU_SENDER_ID",
    appId: "TU_APP_ID"
  }
};
```

## Seguridad

⚠️ **IMPORTANTE:**
- Añade `firebase-service-account.json` al `.gitignore`
- Nunca subas las credenciales a Git
- En producción, usa variables de entorno
