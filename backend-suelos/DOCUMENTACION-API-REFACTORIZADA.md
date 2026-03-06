# 📚 DOCUMENTACIÓN API - ENDPOINTS REFACTORIZADOS

## 🔐 Autenticación
Todos los endpoints (excepto los de cálculo público) requieren el header:
```
Authorization: Bearer {firebase_token}
```

---

## 👤 USUARIOS

### `GET /auth/profile`
Obtener perfil del usuario autenticado
**Respuesta:**
```json
{
  "id": 1,
  "firebaseUid": "abc123...",
  "telefono": "+51900123456",
  "email": "user@example.com",
  "nombre": "Juan Pérez",
  "activo": true,
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

### `PUT /auth/profile`
Actualizar perfil del usuario
**Body:**
```json
{
  "nombre": "Juan Pérez Actualizado",
  "email": "nuevo@example.com"
}
```

---

## 🌾 CHACRAS

### `GET /chacras`
Listar todas las chacras del usuario autenticado
**Respuesta:**
```json
[
  {
    "id": 1,
    "nombre": "Chacra Norte",
    "areaHa": 5.5,
    "ubicacion": "Sector A",
    "descripcion": "Terreno principal",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z",
    "totalCalculos": 3,
    "ultimoCalculo": "2025-01-10T00:00:00.000Z"
  }
]
```

### `POST /chacras`
Crear una nueva chacra
**Body:**
```json
{
  "nombre": "Chacra Sur",
  "areaHa": 3.2,
  "ubicacion": "Sector B",
  "descripcion": "Terreno secundario"
}
```

### `GET /chacras/:id`
Obtener detalles de una chacra específica (incluye sus cálculos)
**Respuesta:**
```json
{
  "id": 1,
  "nombre": "Chacra Norte",
  "areaHa": 5.5,
  "ubicacion": "Sector A",
  "descripcion": "Terreno principal",
  "usuarioId": 1,
  "calculos": [...],
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

### `PUT /chacras/:id`
Actualizar una chacra
**Body:**
```json
{
  "nombre": "Chacra Norte Actualizada",
  "areaHa": 6.0,
  "ubicacion": "Sector A - Ampliado"
}
```

### `DELETE /chacras/:id`
Eliminar una chacra (elimina también todos sus cálculos en cascada)
**Respuesta:**
```json
{
  "message": "Chacra eliminada correctamente"
}
```

---

## 📊 CÁLCULOS DE SUELO

### `GET /chacras/:id/calculos`
Listar todos los cálculos de una chacra
**Respuesta:**
```json
[
  {
    "id": 1,
    "fecha": "2025-01-10T00:00:00.000Z",
    "nombreMuestra": "Análisis Enero 2025",
    "metaRendimiento": 8000,
    "ph": 6.5,
    "materiaOrganica": 3.2,
    "alertasCount": 2,
    "createdAt": "2025-01-10T00:00:00.000Z"
  }
]
```

### `POST /chacras/:id/calculos` ⭐ **NUEVO ENDPOINT REST**
Crear un nuevo cálculo para una chacra (calcular y guardar)
**Body:**
```json
{
  "nombreMuestra": "Análisis Pre-Siembra",
  "datos": {
    "areaHa": 5.5,
    "profundidadMetros": 0.3,
    "idTextura": 2,
    "materiaOrganica": 3.2,
    "fosforoPpm": 15.5,
    "potasioPpm": 180,
    "idZona": 1,
    "ph": 6.5,
    "ce": 1.2,
    "caIntercambiable": 12.5,
    "mgIntercambiable": 3.8,
    "kIntercambiable": 0.45,
    "naIntercambiable": 0.2,
    "acidezIntercambiable": 0.1,
    "b_ppm": 0.5,
    "cu_ppm": 2.3,
    "zn_ppm": 1.8,
    "mn_ppm": 15.2,
    "fe_ppm": 45.5,
    "s_ppm": 12.0,
    "metaRendimiento": 8000,
    "idFuenteN": 1,
    "idFuenteP": 2,
    "idFuenteK": 3
  }
}
```
**Respuesta:**
```json
{
  "calculoId": 5,
  "chacraNombre": "Chacra Norte",
  "resultado": {
    "balanceNutricional": {...},
    "recomendacionFertilizacion": {...},
    "enmiendaCalcio": {...},
    "cronograma": {...},
    "interpretacionQuimica": {...},
    "equilibrioCationico": {...},
    "micronutrientes": {...},
    "alertas": [...]
  }
}
```

### `GET /chacras/:id/calculos/:calculoId`
Obtener un cálculo específico (con todos sus datos y resultados)
**Respuesta:**
```json
{
  "id": 1,
  "fecha": "2025-01-10T00:00:00.000Z",
  "nombreMuestra": "Análisis Enero 2025",
  "chacraId": 1,
  "datosEntrada": {...},
  "resultados": {...},
  "createdAt": "2025-01-10T00:00:00.000Z"
}
```

### `PUT /chacras/:id/calculos/:calculoId` ⭐ **NUEVO ENDPOINT**
Actualizar un cálculo (por ahora solo el nombre de la muestra)
**Body:**
```json
{
  "nombreMuestra": "Análisis Post-Cosecha"
}
```
**Respuesta:**
```json
{
  "message": "Cálculo actualizado correctamente",
  "calculo": {...}
}
```

### `DELETE /chacras/:id/calculos/:calculoId` ⭐ **NUEVO ENDPOINT**
Eliminar un cálculo específico
**Respuesta:**
```json
{
  "message": "Cálculo eliminado correctamente"
}
```

---

## 🧮 CÁLCULO PÚBLICO (SIN AUTENTICACIÓN)

### `POST /calculo-suelo/calcular-nutrientes`
Realizar un cálculo sin guardar (modo invitado)
**Body:** (igual que POST /chacras/:id/calculos pero solo el objeto "datos")
**Respuesta:** Solo el resultado del cálculo sin guardarlo

---

## 📖 CATÁLOGOS

### `GET /catalogo/texturas`
Listar tipos de textura de suelo

### `GET /catalogo/zonas`
Listar zonas agrícolas

### `GET /catalogo/fuentes-fertilizantes`
Listar fuentes de fertilizantes disponibles

### `GET /catalogo/cultivos`
Listar requerimientos por cultivo

---

## 🔄 CAMBIOS IMPORTANTES EN LA REFACTORIZACIÓN

### ✅ **Endpoint Anterior (DEPRECADO):**
```
POST /calculo-suelo/calcular-y-guardar
Body: { chacraId: 1, nombreMuestra: "...", datos: {...} }
```

### ⭐ **Nuevo Endpoint REST (RECOMENDADO):**
```
POST /chacras/:id/calculos
Body: { nombreMuestra: "...", datos: {...} }
```

### 📝 **Ventajas del nuevo enfoque:**
1. ✅ Más REST-ful (recurso anidado)
2. ✅ chacraId en la URL (más claro)
3. ✅ Consistente con otros endpoints CRUD
4. ✅ Endpoints completos para gestión de cálculos (crear, leer, actualizar, eliminar)

---

## 🚨 ERRORES CORREGIDOS

1. **dropSchema eliminado** - Ya no borra la BD al reiniciar
2. **Bug de userId corregido** - Ahora obtiene correctamente el usuario de BD
3. **Arquitectura REST mejorada** - Endpoints más intuitivos y consistentes
4. **DTOs de respuesta** - Respuestas más predecibles y tipadas

---

## 🎯 FLUJO RECOMENDADO PARA EL FRONTEND

1. **Login** → Usuario se autentica con Firebase
2. **Dashboard** → `GET /chacras` (listar chacras del usuario)
3. **Crear Chacra** → `POST /chacras`
4. **Ver Chacra** → `GET /chacras/:id`
5. **Realizar Cálculo** → `POST /chacras/:id/calculos`
6. **Ver Cálculo** → `GET /chacras/:id/calculos/:calculoId`
7. **Editar Nombre** → `PUT /chacras/:id/calculos/:calculoId`
8. **Eliminar Cálculo** → `DELETE /chacras/:id/calculos/:calculoId`
