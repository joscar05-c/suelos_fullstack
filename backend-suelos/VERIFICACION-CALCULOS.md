# 📊 Guía de Verificación de Cálculos - Sistema de Suelos

## 🎯 Objetivo
Este documento te ayuda a verificar manualmente que los cálculos del sistema son correctos.

---

## 📝 CASO DE PRUEBA VERIFICABLE

### Datos de Entrada:
```json
{
  "areaHa": 1,
  "profundidadMetros": 0.3,
  "idTextura": 1,      // Textura "Arenoso" = 1.70 t/m³
  "materiaOrganica": 4,
  "fosforoPpm": 15,
  "potasioPpm": 120,
  "idZona": 1          // Zona "Costa" = 2%
}
```

### Datos de BD (según semilla.service.ts):
- **Textura ID 1 "Arenoso"**: densidadAparente = 1.70
- **Zona ID 1 "Costa"**: porcentaje = 2.00
- **Factor N**: disponibilidad = 0.30
- **Factor P**: disponibilidad = 0.20
- **Factor K**: disponibilidad = 0.40

---

## 🔢 CÁLCULOS MANUALES PASO A PASO

### **PASO B: Peso Capa Arable (PCA)**

```
areaM2 = 1 Ha × 10,000 = 10,000 m²
pcaToneladas = 10,000 m² × 1.70 t/m³ × 0.3 m
pcaToneladas = 5,100 toneladas ✓
```

---

### **PASO C: Nitrógeno (N)**

```
1. moTotal = 5,100 t × (4 / 100)
   moTotal = 5,100 × 0.04 = 204 toneladas

2. nOrganico = 204 t × 0.05
   nOrganico = 10.2 toneladas

3. nMineralizado = 10.2 t × (2 / 100)
   nMineralizado = 10.2 × 0.02 = 0.204 toneladas

4. nMineralizadoKg = 0.204 t × 1,000
   nMineralizadoKg = 204 kg ← CRUCIAL: Conversión a kg

5. nDisponible = 204 kg × 0.30
   nDisponible = 61.2 kg ✓
```

**⚠️ PUNTO CRÍTICO**: Si el sistema devuelve 0.0612 kg en lugar de 61.2 kg, significa que faltó la conversión de toneladas a kg.

---

### **PASO D: Fósforo (P)**

```
1. pElementalKg = (15 ppm × 5,100 t) / 1,000
   pElementalKg = 76,500 / 1,000 = 76.5 kg

2. p2o5Total = 76.5 kg × 2.29
   p2o5Total = 175.185 kg

3. pDisponible = 175.185 kg × 0.20
   pDisponible = 35.037 kg ✓
```

---

### **PASO E: Potasio (K)**

```
1. kElementalKg = (120 ppm × 5,100 t) / 1,000
   kElementalKg = 612,000 / 1,000 = 612 kg

2. k2oTotal = 612 kg × 1.205
   k2oTotal = 737.46 kg

3. kDisponible = 737.46 kg × 0.40
   kDisponible = 294.984 kg ✓
```

---

## ✅ RESULTADO ESPERADO

```json
{
  "pcaToneladas": 5100,
  "nitrogenoDisponibleKg": 61.2,
  "fosforoDisponibleKg": 35.037,
  "potasioDisponibleKg": 294.984
}
```

---

## 🧪 CÓMO PROBAR

### Opción 1: Usando VS Code REST Client
1. Instala la extensión "REST Client" en VS Code
2. Abre el archivo `test-calculo.http`
3. Asegúrate de que el servidor esté corriendo (`npm run start:dev`)
4. Click en "Send Request" sobre cualquier caso de prueba
5. Compara el resultado con los cálculos manuales

### Opción 2: Usando Postman/Thunder Client
1. Crea una petición POST a: `http://localhost:3000/calculo-suelo/calcular-nutrientes`
2. Headers: `Content-Type: application/json`
3. Body (raw JSON): Copia cualquier caso de prueba del archivo .http
4. Envía la petición

### Opción 3: Usando cURL desde terminal
```bash
curl -X POST http://localhost:3000/calculo-suelo/calcular-nutrientes \
  -H "Content-Type: application/json" \
  -d '{
    "areaHa": 1,
    "profundidadMetros": 0.3,
    "idTextura": 1,
    "materiaOrganica": 4,
    "fosforoPpm": 15,
    "potasioPpm": 120,
    "idZona": 1
  }'
```

---

## 🔍 CHECKLIST DE VERIFICACIÓN

- [ ] El servidor está corriendo (`npm run start:dev`)
- [ ] La base de datos tiene los datos necesarios (Texturas, Tasas, Factores)
- [ ] El endpoint responde sin errores
- [ ] `pcaToneladas` coincide con el cálculo manual (±0.01)
- [ ] `nitrogenoDisponibleKg` está en orden de decenas/centenas (NO decimales pequeños)
- [ ] `fosforoDisponibleKg` coincide con el cálculo manual (±0.01)
- [ ] `potasioDisponibleKg` coincide con el cálculo manual (±0.01)

---

## ⚠️ ERRORES COMUNES A DETECTAR

### Error 1: Nitrógeno muy pequeño
- **Síntoma**: `nitrogenoDisponibleKg: 0.0936` en lugar de `93.6`
- **Causa**: Falta la multiplicación por 1000 para convertir toneladas a kg
- **Solución**: Verificar que existe la línea `nMineralizadoKg = nMineralizado * 1000`

### Error 2: 404 Not Found
- **Causa**: IDs de textura o zona no existen en BD
- **Solución**: Insertar datos de prueba usando el archivo de semillas

### Error 3: ValidationError
- **Causa**: Datos de entrada inválidos
- **Solución**: Verificar que todos los números sean positivos y válidos

---

## 📊 TABLA DE VALIDACIÓN RÁPIDA

| Campo | Valor Esperado | Tolerancia |
|-------|---------------|------------|
| pcaToneladas | 5,100.00 | ±0.1 |
| nitrogenoDisponibleKg | 61.20 | ±0.5 |
| fosforoDisponibleKg | 35.04 | ±0.5 |
| potasioDisponibleKg | 294.98 | ±0.5 |

---

## 💡 TIPS

1. **Primero verifica que tengas datos en la BD**: Si recibes errores 404, necesitas ejecutar el servicio de semillas
2. **Los valores deben ser "razonables"**: El nitrógeno debería estar entre 50-500 kg para 1 hectárea típica
3. **Usa calculadora**: Verifica manualmente al menos un cálculo completo
4. **Compara proporciones**: Si duplicas el área, todos los resultados deberían duplicarse

---

## 🎓 FÓRMULAS DE REFERENCIA

```typescript
// PASO B
pcaToneladas = areaHa * 10000 * densidad * profundidadMetros

// PASO C (Nitrógeno)
moTotal = pcaToneladas * (materiaOrganica / 100)
nOrganico = moTotal * 0.05
nMineralizado = nOrganico * (porcentajeMineralizacion / 100)
nMineralizadoKg = nMineralizado * 1000  // ← ¡IMPORTANTE!
nDisponible = nMineralizadoKg * factorDisponibilidadN

// PASO D (Fósforo)
pElementalKg = (fosforoPpm * pcaToneladas) / 1000
p2o5Total = pElementalKg * 2.29
pDisponible = p2o5Total * factorDisponibilidadP

// PASO E (Potasio)
kElementalKg = (potasioPpm * pcaToneladas) / 1000
k2oTotal = kElementalKg * 1.205
kDisponible = k2oTotal * factorDisponibilidadK
```
