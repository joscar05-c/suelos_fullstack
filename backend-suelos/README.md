<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

# 🌾 Sistema de Cálculo de Suelos - Backend

Sistema avanzado de análisis de suelos y recomendación de fertilización comercial basado en NestJS y TypeORM.

## 🚀 Características Principales

### 📊 Análisis Completo de Suelos
- **Nutrientes Disponibles**: Cálculo de N, P₂O₅ y K₂O considerando textura, materia orgánica y mineralización
- **Propiedades Químicas**: CIC, saturación de bases (Ca, Mg, K, Na), diagnóstico de pH, MO y CE
- **Equilibrio Catiónico**: 4 relaciones críticas (Ca/Mg, Ca/K, Mg/K, K/Mg) con alertas agronómicas
- **Micronutrientes**: Interpretación de B, Cu, Zn, Mn y Fe con recomendaciones específicas

### 🧮 **Algoritmo en Cascada** (🔥 Innovación Clave)
Sistema inteligente de fertilización que **optimiza el uso de fertilizantes compuestos**:

```
P (prioridad 1) → K (prioridad 2) → N (prioridad 3)
```

**Ventajas**:
- ✅ Considera aportes cruzados de fertilizantes compuestos (ej: Guano de Isla)
- ✅ Reduce hasta **25% el uso de Urea** al contabilizar N aportado por otros fertilizantes
- ✅ Optimiza costos de producción
- ✅ Minimiza sobre-fertilización y contaminación ambiental

📖 **Ver documentación completa**: [ALGORITMO-CASCADA.md](./ALGORITMO-CASCADA.md)

### 🎯 Balance Nutricional
Cálculo preciso de déficit/superávit:
```
Déficit = Requerimiento - Disponibilidad
```
Considerando:
- Meta de rendimiento (Comercial, Alto, Exportación)
- Eficiencias de fertilizantes (N: 60%, P: 25%, K: 70%)
- Aportes cruzados de productos compuestos

---

## 🗄️ Base de Datos

### Entidades (8 tablas)
1. **TexturaSuelo**: 5 tipos (Arenoso, Franco Arenoso, Franco, Franco Arcilloso, Arcilloso)
2. **TasaMineralizacion**: 5 rangos de MO con factores de conversión
3. **FactorNutriente**: 3 nutrientes (N, P, K) con factores de extracción
4. **RangoIdeal**: 6 parámetros con rangos óptimos (pH, MO, CE, saturaciones)
5. **RelacionCationica**: 4 relaciones con límites críticos
6. **NivelCriticoMicro**: 15 combinaciones cultivo-micronutriente
7. **RequerimientoCultivo**: 5 cultivos con requerimientos N-P-K
8. **FuenteFertilizante**: 6 productos comerciales (Urea, SFT, Guano, KCl, etc.)

### Seeders Automatizados
```bash
npm run start:dev  # Los seeders se ejecutan automáticamente al iniciar
```

---

## ⚙️ Instalación

### Requisitos Previos
- Node.js 18+
- PostgreSQL 14+
- npm o yarn

### Pasos

1. **Clonar repositorio**
```bash
git clone <repo-url>
cd backend-suelos
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
# Editar .env con credenciales de PostgreSQL
```

4. **Iniciar base de datos** (Docker Compose incluido)
```bash
docker-compose up -d
```

5. **Ejecutar aplicación**
```bash
# Modo desarrollo (con seeders automáticos)
npm run start:dev

# Modo producción
npm run build
npm run start:prod
```

---

## 🔌 API

### Endpoint Principal
```http
POST http://localhost:3000/calculo-suelo/calcular-nutrientes
Content-Type: application/json

{
  "textura": "Franco",
  "cultivo": "Maíz",
  "rendimiento_esperado": 12,
  "ph": 6.5,
  "materia_organica": 2.8,
  "nitrogeno_disponible": 45,
  "fosforo_disponible": 8,
  "potasio_disponible": 180,
  "calcio_intercambiable": 3200,
  "magnesio_intercambiable": 450,
  "potasio_intercambiable": 195,
  "sodio_intercambiable": 85,
  "conductividad_electrica": 1.2,
  "boro": 0.45,
  "cobre": 2.8,
  "zinc": 1.2,
  "manganeso": 5.5,
  "hierro": 28,
  "metaRendimiento": "Comercial",
  "idFuenteN": 1,   // 1: Urea
  "idFuenteP": 6,   // 6: Guano de Isla
  "idFuenteK": 4    // 4: Cloruro de Potasio
}
```

### Respuesta Ejemplo
```json
{
  "nutrientes_disponibles": {
    "nitrogeno_total": 45.0,
    "fosforo_total": 8.0,
    "potasio_total": 180.0
  },
  "propiedades_quimicas": {
    "cic_meq_100g": 20.77,
    "saturacion_ca": 61.53,
    "saturacion_mg": 10.88,
    "saturacion_k": 3.75,
    "saturacion_na": 1.63,
    "diagnostico": "CIC ideal, Saturación de Ca ideal, ..."
  },
  "equilibrio_cationico": {
    "ca_mg": { "valor": 5.65, "rango": "2-5", "estado": "Alto" },
    "ca_k": { "valor": 16.41, "rango": "10-15", "estado": "Alto" }
  },
  "micronutrientes": {
    "Boro": { "valor": 0.45, "clasificacion": "Bajo" },
    "Cobre": { "valor": 2.8, "clasificacion": "Adecuado" }
  },
  "balance_nutricional": {
    "deficit_nitrogeno": 141.07,
    "deficit_fosforo": 33.05,
    "deficit_potasio": 24.0
  },
  "recomendacion_fertilizacion": {
    "Fosforo": {
      "producto": "Guano de Isla",
      "cantidad_kg_ha": 275.4,
      "aporta_nitrogeno": 35.8,    // 🔥 Aporte cruzado
      "aporta_potasio": 6.88        // 🔥 Aporte cruzado
    },
    "Potasio": {
      "producto": "Cloruro de Potasio",
      "cantidad_kg_ha": 40.76,
      "deficit_original": 24.0,
      "deficit_ajustado": 17.12     // 🔥 Ajustado por P
    },
    "Nitrogeno": {
      "producto": "Urea",
      "cantidad_kg_ha": 228.37,     // 🔥 Reducido de 306 kg
      "deficit_original": 141.07,
      "aporte_de_otros_fertilizantes": 35.8,  // 🔥 Del Guano
      "deficit_ajustado": 105.27    // 🔥 Ajustado
    }
  },
  "alertas": [
    { "parametro": "pH", "mensaje": "Ideal", "severidad": "baja" },
    { "parametro": "Ca/Mg", "mensaje": "Alto - Considerar aplicación de Magnesio", "severidad": "media" }
  ]
}
```

### Tests Incluidos
- `test-calculo.http`: Test básico con valores del Ejercicio 1
- `test-cascada-guano.http`: **Test del Algoritmo en Cascada** (Ejercicio 2, páginas 12-13)

---

## 📚 Documentación Técnica

- **[ALGORITMO-CASCADA.md](./ALGORITMO-CASCADA.md)**: Explicación completa del algoritmo inteligente de fertilización
- **[VERIFICACION-CALCULOS.md](./VERIFICACION-CALCULOS.md)**: Validación matemática de cálculos
- Anexos del PDF manual (incluidos en seeders)

---

## 🛠️ Stack Tecnológico

- **Framework**: NestJS 10+
- **ORM**: TypeORM con PostgreSQL
- **Validación**: class-validator + class-transformer
- **Precisión**: Cálculos con 3 decimales (.toFixed(3))
- **Docker**: Compose para PostgreSQL

---

## 📖 Comandos Útiles

```bash
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

---

## 🤝 Contribuciones

Este proyecto implementa cálculos científicos basados en:
- Manual técnico de fertilización (Ejercicios 1 y 2)
- Anexos 1-9 del manual
- Mejores prácticas agronómicas

---

## 📝 Licencia

MIT

---

## 👨‍💻 Autor

Sistema desarrollado para optimizar la fertilización agrícola mediante algoritmos inteligentes.

