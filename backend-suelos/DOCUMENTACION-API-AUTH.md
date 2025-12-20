# API de Autenticación y Gestión de Chacras

## 📋 Endpoints Implementados

### 🔐 Autenticación

#### 1. Registrar Usuario
```http
POST http://localhost:3000/auth/register
Content-Type: application/json

{
  "email": "agricultor@ejemplo.com",
  "password": "123456",
  "nombre": "Juan Pérez",
  "telefono": "+51987654321"
}
```

**Respuesta:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "agricultor@ejemplo.com",
    "nombre": "Juan Pérez",
    "telefono": "+51987654321",
    "activo": true
  }
}
```

---

#### 2. Iniciar Sesión
```http
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "email": "agricultor@ejemplo.com",
  "password": "123456"
}
```

**Respuesta:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "agricultor@ejemplo.com",
    "nombre": "Juan Pérez",
    "telefono": "+51987654321"
  }
}
```

---

#### 3. Obtener Perfil (Protegido)
```http
GET http://localhost:3000/auth/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Respuesta:**
```json
{
  "id": 1,
  "email": "agricultor@ejemplo.com",
  "nombre": "Juan Pérez",
  "telefono": "+51987654321",
  "activo": true,
  "chacras": [
    {
      "id": 1,
      "nombre": "Chacra Norte",
      "areaHa": 15.5
    }
  ]
}
```

---

### 🌾 Gestión de Chacras (Todas protegidas con JWT)

#### 4. Listar Chacras del Usuario
```http
GET http://localhost:3000/chacras
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Respuesta:**
```json
[
  {
    "id": 1,
    "nombre": "Chacra Norte",
    "areaHa": "15.50",
    "ubicacion": "Jaén, Cajamarca",
    "descripcion": "Zona de cultivo principal",
    "totalCalculos": 5,
    "ultimoCalculo": "2025-12-10T15:30:00.000Z"
  },
  {
    "id": 2,
    "nombre": "Chacra Sur",
    "areaHa": "8.00",
    "ubicacion": "San Ignacio",
    "totalCalculos": 2,
    "ultimoCalculo": "2025-12-05T10:00:00.000Z"
  }
]
```

---

#### 5. Crear Nueva Chacra
```http
POST http://localhost:3000/chacras
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "nombre": "Chacra Experimental",
  "areaHa": 12.5,
  "ubicacion": "Bagua Grande, Amazonas",
  "descripcion": "Zona de pruebas con nuevas variedades"
}
```

**Respuesta:**
```json
{
  "id": 3,
  "nombre": "Chacra Experimental",
  "areaHa": "12.50",
  "ubicacion": "Bagua Grande, Amazonas",
  "descripcion": "Zona de pruebas con nuevas variedades",
  "usuarioId": 1
}
```

---

#### 6. Obtener Detalles de Chacra
```http
GET http://localhost:3000/chacras/1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Respuesta:**
```json
{
  "id": 1,
  "nombre": "Chacra Norte",
  "areaHa": "15.50",
  "ubicacion": "Jaén, Cajamarca",
  "descripcion": "Zona de cultivo principal",
  "usuarioId": 1
}
```

---

#### 7. Actualizar Chacra
```http
PUT http://localhost:3000/chacras/1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "areaHa": 16.0,
  "descripcion": "Zona de cultivo principal - expandida"
}
```

**Respuesta:**
```json
{
  "id": 1,
  "nombre": "Chacra Norte",
  "areaHa": "16.00",
  "ubicacion": "Jaén, Cajamarca",
  "descripcion": "Zona de cultivo principal - expandida",
  "usuarioId": 1
}
```

---

#### 8. Eliminar Chacra
```http
DELETE http://localhost:3000/chacras/1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Respuesta:**
```json
{
  "message": "Chacra eliminada correctamente"
}
```

---

### 📊 Historial de Cálculos

#### 9. Listar Cálculos de una Chacra
```http
GET http://localhost:3000/chacras/1/calculos
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Respuesta:**
```json
[
  {
    "id": 15,
    "fecha": "2025-12-10T15:30:00.000Z",
    "nombreMuestra": "Análisis Marzo 2025",
    "metaRendimiento": 30,
    "ph": 5.8,
    "alertasCount": 2
  },
  {
    "id": 14,
    "fecha": "2025-11-20T10:00:00.000Z",
    "nombreMuestra": "Análisis pre-fertilización",
    "metaRendimiento": 28,
    "ph": 6.0,
    "alertasCount": 1
  }
]
```

---

#### 10. Obtener Cálculo Específico
```http
GET http://localhost:3000/chacras/1/calculos/15
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Respuesta:**
```json
{
  "id": 15,
  "fecha": "2025-12-10T15:30:00.000Z",
  "nombreMuestra": "Análisis Marzo 2025",
  "datosEntrada": {
    "ca_meq_100g": 4.0,
    "mg_meq_100g": 1.9,
    "k_meq_100g": 0.45,
    "ph": 5.8,
    "metaRendimiento": 30
  },
  "resultados": {
    "balanceNutricional": {
      "calcio": { "disponible": 466.67, "requerido": 585.0 },
      "magnesio": { "disponible": 467.56, "requerido": 270.0 }
    },
    "recomendacionFertilizacion": {},
    "cronograma": {},
    "alertas": []
  }
}
```

---

### 🧮 Cálculo de Nutrientes

#### 11. Calcular sin Guardar (Público - Modo Invitado)
```http
POST http://localhost:3000/calculo-suelo/calcular-nutrientes
Content-Type: application/json

{
  "ca_meq_100g": 4.0,
  "mg_meq_100g": 1.9,
  "k_meq_100g": 0.45,
  "na_meq_100g": 0.2,
  "al_meq_100g": 0.5,
  "ph": 5.8,
  "mo_porcentaje": 3.5,
  "p_ppm": 15,
  "s_ppm": null,
  "b_ppm": 0.3,
  "cu_ppm": 2.0,
  "zn_ppm": 1.5,
  "mn_ppm": 8.0,
  "fe_ppm": 50.0,
  "textura": "FRANCO",
  "zona_cafetera": "ZONA_NORTE",
  "metaRendimiento": 30,
  "fuenteN": "UREA",
  "fuenteP": "SFT",
  "fuenteK": "KCL",
  "enmiendaCalcica": "YESO"
}
```

**Respuesta:** Objeto completo con balance, recomendaciones, cronograma y alertas.

---

#### 12. Calcular y Guardar en Chacra (Protegido)
```http
POST http://localhost:3000/calculo-suelo/calcular-y-guardar
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "chacraId": 1,
  "nombreMuestra": "Análisis Abril 2025",
  "datos": {
    "ca_meq_100g": 4.0,
    "mg_meq_100g": 1.9,
    "k_meq_100g": 0.45,
    "na_meq_100g": 0.2,
    "al_meq_100g": 0.5,
    "ph": 5.8,
    "mo_porcentaje": 3.5,
    "p_ppm": 15,
    "s_ppm": null,
    "b_ppm": 0.3,
    "cu_ppm": 2.0,
    "zn_ppm": 1.5,
    "mn_ppm": 8.0,
    "fe_ppm": 50.0,
    "textura": "FRANCO",
    "zona_cafetera": "ZONA_NORTE",
    "metaRendimiento": 30,
    "fuenteN": "UREA",
    "fuenteP": "SFT",
    "fuenteK": "KCL",
    "enmiendaCalcica": "YESO"
  }
}
```

**Respuesta:**
```json
{
  "calculoId": 16,
  "chacraNombre": "Chacra Norte",
  "resultado": {
    "balanceNutricional": {},
    "recomendacionFertilizacion": {},
    "cronograma": {},
    "alertas": []
  }
}
```

---

## 🔑 Autenticación JWT

Todas las rutas de chacras y el endpoint `calcular-y-guardar` requieren token JWT en el header:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Flujo de autenticación:**
1. Registrar o iniciar sesión → obtener `access_token`
2. Incluir token en header `Authorization: Bearer {token}`
3. Token válido por 7 días
4. Si el token expira, volver a hacer login

---

## 🗄️ Base de Datos

### Tablas Creadas Automáticamente

Con `synchronize: true`, TypeORM crea automáticamente:

- **usuario**: id, email, password, nombre, telefono, activo, createdAt
- **chacra**: id, nombre, areaHa, ubicacion, descripcion, usuarioId, createdAt
- **calculo_suelo**: id, chacraId, nombreMuestra, datosEntrada (JSONB), resultados (JSONB), createdAt

### Relaciones

```
Usuario (1) ──< Chacra (N)
Chacra (1) ──< CalculoSuelo (N)
```

**Cascade DELETE**: Si eliminas un usuario, se eliminan todas sus chacras y cálculos.

---

## 🧪 Flujo de Usuario Típico

1. **Modo Invitado** → POST `/calculo-suelo/calcular-nutrientes` (sin auth)
2. **Registro** → POST `/auth/register` → Obtener JWT
3. **Crear Chacra** → POST `/chacras` con JWT
4. **Calcular y Guardar** → POST `/calculo-suelo/calcular-y-guardar` con JWT
5. **Ver Historial** → GET `/chacras/:id/calculos` con JWT
6. **Comparar Resultados** → GET `/chacras/:id/calculos/:calculoId` con JWT

---

## 📦 Variables de Entorno (.env)

```env
DB_HOST=localhost
DB_PORT=5434
DB_USERNAME=suelos_user
DB_PASSWORD=verano8080
DB_DATABASE=suelos_db
PORT=3000
JWT_SECRET=mi_clave_secreta_super_segura_2024_cambiar_en_produccion
```

---

## ✅ Estado del Backend

- ✅ Sistema de autenticación JWT
- ✅ Registro y login de usuarios
- ✅ Gestión de múltiples chacras
- ✅ Historial de cálculos por chacra
- ✅ Almacenamiento JSONB flexible
- ✅ Verificación de propiedad (seguridad)
- ✅ Cascade delete configurado
- ✅ Tokens de 7 días de duración
- ✅ Endpoints públicos y protegidos

---

## 🚀 Próximos Pasos (Frontend Angular/Ionic)

1. Implementar interceptor HTTP para agregar JWT automáticamente
2. Guardar token en localStorage/sessionStorage
3. Crear páginas: Login, Register, Dashboard (lista chacras)
4. Implementar detalle de chacra con historial de cálculos
5. Agregar funcionalidad "Guardar" después de calcular
6. Implementar comparación visual de cálculos históricos
7. Agregar gráficos de evolución de nutrientes
