# 📱 Configuración Firebase - Pasos Detallados

## 1. Configurar Authentication

1. En Firebase Console, ve a **Authentication** > **Sign-in method**
2. Habilita **Phone** como método de inicio de sesión
3. En la sección **Phone**, haz clic en **Enable**
4. Acepta los términos y condiciones
5. **Guardar**

## 2. Configurar Web App

1. En la página principal del proyecto, haz clic en **Web icon (</>) **
2. **App nickname:** `suelos-frontend`
3. **No marques** "Also set up Firebase Hosting"
4. **Register app**

## 3. Copiar Configuración

Copia la configuración que aparece y reemplázala en:
`frontend-suelos/src/app/services/firebase-auth.service.ts`

```typescript
const firebaseConfig = {
  apiKey: "TU_API_KEY_AQUÍ",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto-id",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

## 4. Generar Service Account (Backend)

1. Ve a **Project Settings** > **Service Accounts**
2. Haz clic en **Generate new private key**
3. **Download** el archivo JSON
4. Guárdalo como `firebase-service-account.json` en la carpeta `backend-suelos/`

## 5. Configurar Variables de Entorno

Del archivo JSON descargado, copia:
- `project_id` → FIREBASE_PROJECT_ID
- `client_email` → FIREBASE_CLIENT_EMAIL
- `private_key` → FIREBASE_PRIVATE_KEY

Actualiza `.env` del backend:
```env
FIREBASE_PROJECT_ID=tu-proyecto-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xyz@tu-proyecto.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nTU_CLAVE_PRIVADA\n-----END PRIVATE KEY-----"
```

## 6. Configurar Dominios Autorizados

En **Authentication** > **Settings** > **Authorized domains**:
- Agregar: `localhost` (para desarrollo)
- Agregar: `tu-dominio.com` (para producción)

## ✅ Listo para Probar

Una vez completados estos pasos, ya puedes probar la autenticación por teléfono.