# Arquitectura de Software y Modelado Agronómico: Sistema Offline-First para Fertilización de Café (*Coffea arabica*)

> **Documento de Especificación Técnica y Arquitectónica para Artículo Científico**  
> **Producto Tecnológico de Investigación Aplicada**  
> **Coste de Operación en Servidor:** $0.00 USD / mes (Arquitectura Edge BaaS + Client-Side Computing)

---

## 1. Resumen Ejecutivo y Motivación

En las zonas cafetaleras de Perú y Latinoamérica (e.g., Selva Central, San Martín, Cajamarca, Puno), los productores cafetaleros y técnicos agrónomos enfrentan dos barreras críticas para la adopción de tecnologías de agricultura de precisión:
1. **Brecha de Conectividad (Zonas Blancas de Telecomunicaciones):** Más del 70% de las parcelas cafetaleras carecen de cobertura celular continua (3G/4G/5G). Los sistemas cliente-servidor tradicionales fallan inmediatamente en el campo por dependencia de latencia HTTP.
2. **Costo de Mantenimiento de Infraestructura:** El despliegue de microservicios o arquitecturas monolíticas en servidores dedicados o VPS (como Node.js/NestJS, Docker, bases de datos gestionadas de pago) impone un costo recurrente mensual prohibitivo para proyectos de investigación y pequeñas cooperativas agrarias.

Para solucionar este desafío, se diseñó e implementó una **arquitectura híbrida Offline-First de Costo Cero ($0.00/mes)**, desacoplando el motor de cálculo agronómico directamente al dispositivo móvil (Client-Side Pure Engine) y utilizando Backend-as-a-Service (BaaS) distribuido (Supabase PostgreSQL + Firebase Phone Auth OTP) con sincronización asíncrona diferida.

---

## 2. Clean Architecture (Arquitectura Limpia)

El sistema implementa los principios de **Clean Architecture** (Robert C. Martin), separando el núcleo de negocio agronómico de los mecanismos de entrega, interfaz gráfica y servicios de nube.

```
┌─────────────────────────────────────────────────────────────┐
│  CAPA DE PRESENTACIÓN / UI (Ionic 7 + Angular Standalone)   │
│  - Páginas: Dashboard, Detalle Parcela, Calculadora, Login  │
│  - Componentes Reactivos con Señales y RxJS Observables     │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│  CAPA DE APLICACIÓN / SERVICIOS DE ORQUESTACIÓN             │
│  - ChacrasService (Gestión de parcelas y repositorio)        │
│  - SueloService (Orquestador de cálculos)                   │
│  - SyncService (Máquina de estados de sincronización)       │
│  - FirebaseAuthService (Gestión de identidad y sesión)       │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│  CAPA DE DOMINIO AGRONÓMICO (100% PURO, SIN DEPENDENCIAS)   │
│  - SoilCalculationEngine (Motor de Fórmulas y Cascada)       │
│  - agronomic.models.ts (Entidades, DTOs y Tipos de Dominio)  │
│  - agronomic-tables.constant.ts (Constantes y Tablas INIA)  │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│  CAPA DE INFRAESTRUCTURA Y PERSISTENCIA                     │
│  - OfflineStorageService (LocalStorage / IndexDB con Cache) │
│  - SupabaseService (Cliente PostgreSQL con RLS y GIN)       │
│  - Firebase Auth (Verificación telefónica SMS OTP)           │
└─────────────────────────────────────────────────────────────┘
```

### Regla de Dependencia Estricta
- El **Motor Agronómico (`SoilCalculationEngine`)** no importa Angular, Ionic, Supabase, Firebase ni ninguna biblioteca de terceros. Es **TypeScript puro**, lo que garantiza:
  - **Determinismo matemático y reproducibilidad:** Mismos datos de entrada producen idénticos resultados científicos en cualquier entorno (web, móvil, node, tests unitarios).
  - **Latencia cero (0 ms):** El cálculo se ejecuta de forma inmediata en la CPU local del smartphone.

---

## 3. Fundamentación Agronómica y Fórmulas del Motor

El motor integra la metodología técnica descrita en la literatura agronómica especializada:
- **DOC 1:** *Manual de Interpretación de Análisis de Suelo* (UNALM, Carvajal, ICAFE, Sanchez, Villagarcia, Guerrero).
- **DOC 2:** *Programa de Asistentes Técnicos en Cafés Especiales* (JNC / INIA).

### 3.1. Estimación del Peso de la Capa Arable (PCA)
Para 1 hectárea ($10,000\text{ m}^2$):
$$\text{PCA (kg/ha)} = \text{Área (m}^2) \times \text{Profundidad (m)} \times \text{Densidad Aparente (g/cm}^3) \times 1,000$$

Donde la Densidad Aparente ($\text{DA}$) se asigna automáticamente según la clase textural (Anexo 1 - DOC 1):
- Arenoso: $1.50\text{ g/cm}^3$
- Franco arenoso: $1.40\text{ g/cm}^3$
- Franco: $1.30\text{ g/cm}^3$
- Franco arcilloso: $1.25\text{ g/cm}^3$
- Arcilloso: $1.20\text{ g/cm}^3$

### 3.2. Suministro del Suelo (Disponibilidad de Nutrientes)
1. **Nitrógeno disponible ($N$):**
   $$N_{\text{suelo}} = \text{PCA} \times \left(\frac{\%MO}{100}\right) \times 0.05 \times \text{Tasa Mineralización} \times \text{Factor Conversión (0.02)}$$
   *La tasa de mineralización varía según la zona bioclimática (Costa, Sierra, Selva Alta, Selva Baja).*
2. **Fósforo elemental ($P$):**
   $$P_{\text{ppm}} = P_{\text{Bray I}}; \quad P_{\text{kg/ha}} = \left(\frac{P_{\text{ppm}} \times \text{PCA}}{1,000,000}\right) \times \text{Factor Eficiencia}$$
3. **Potasio elemental ($K$):**
   $$K_{\text{kg/ha}} = \left(\frac{K_{\text{ppm}} \times \text{PCA}}{1,000,000}\right) \times \text{Factor Eficiencia}$$

### 3.3. Algoritmo de Fertilización en Cascada con Deducción de Fertilizantes Compuestos
Los fertilizantes comerciales a menudo aportan nutrientes secundarios (por ejemplo, el Guano de Isla aporta $12\%\text{ N}$, $11\%\text{ }P_2O_5$, $2.5\%\text{ }K_2O$, $8.5\%\text{ CaO}$, $1.5\%\text{ MgO}$). 

Para evitar sobrefertilización y costos excesivos al caficultor, el motor implementa un algoritmo de compensación en cascada:
1. **Paso 1 (Fósforo):** Se calcula la cantidad de fertilizante fosfatado seleccionado ($F_P$). Si $F_P$ aporta Nitrógeno o Calcio (e.g., Fosfato Diamónico o Guano), se registran los aportes secundarios:
   $$N_{\text{aportado}} = F_P \times \%N_{F_P}; \quad CaO_{\text{aportado}} = F_P \times \%CaO_{F_P}$$
2. **Paso 2 (Nitrógeno):** La demanda neta de Nitrógeno a satisfacer con la fuente nitrogenada principal se ajusta restando los aportes previos:
   $$\text{Dosis neta } N = \max(0, \text{Demanda } N - N_{\text{aportado}})$$
3. **Paso 3 (Potasio):** Se satisface la demanda neta de $K_2O$ deduciendo aportes de enmiendas o fuentes mixtas previas.
4. **Paso 4 (Enmiendas y Calcio):** Se calcula la dosis de cal agrícola ($\text{CaCO}_3$) o cal dolomítica, deduciendo el $\text{CaO}$ ya aportado por el Guano de Isla o fertilizantes fosfatados.
5. **Paso 5 (Fraccionamiento en 3 Épocas):**
   - Época 1 (Desarrollo vegetativo / Post-cosecha): $40\%\text{ N}$, $50\%\text{ }P_2O_5$, $30\%\text{ }K_2O$
   - Época 2 (Llenado de grano): $30\%\text{ N}$, $25\%\text{ }P_2O_5$, $40\%\text{ }K_2O$
   - Época 3 (Maduración): $30\%\text{ N}$, $25\%\text{ }P_2O_5$, $30\%\text{ }K_2O$
6. **Paso 6 (Dosis por Planta):** Sobre una densidad estándar de $5,000\text{ plantas/ha}$ (típica en variedades como Caturra, Catimor, Geisha):
   $$\text{Dosis (g/planta)} = \frac{\text{Cantidad de Fertilizante (kg)} \times 1,000}{5,000}$$

---

## 4. Normalización de Base de Datos y Modelo de Persistencia

La persistencia se aloja en PostgreSQL gestionado por **Supabase** (región São Paulo `sa-east-1` para menor latencia en Sudamérica).

### 4.1. Tercera Forma Normal (3NF) en Catálogos Maestros
Todas las tablas referenciales cumplen estrictamente con la **Tercera Forma Normal (3NF)**:
1. `texturas_suelo`: Clases texturales con Densidades Aparentes.
2. `tasas_mineralizacion`: Tasas de descomposición por zona ecológica.
3. `factores_nutrientes`: Factores de conversión elemental a óxidos ($P \to P_2O_5 \times 2.29$, $K \to K_2O \times 1.20$, $Ca \to CaO \times 1.40$, $Mg \to MgO \times 1.66$).
4. `eficiencias_nutrientes`: Eficiencias de absorción agronómica por nutriente.
5. `rangos_ideales`: Niveles de suficiencia de pH, Materia Orgánica, P, K, Ca, Mg, CIC, etc.
6. `relaciones_cationicas`: Umbrales de equilibrio catiónico ($Ca/Mg$, $Mg/K$, $(Ca+Mg)/K$).
7. `niveles_criticos_micro`: Rangos críticos para $B, Cu, Fe, Mn, Zn$.
8. `requerimientos_cultivo`: Demanda nutricional por quintal métrico de café ($10$ a $60\text{ qq/ha}$).
9. `fuentes_fertilizantes`: Catálogo de 24 fertilizantes certificados (Anexos 9-A y 9-B).
10. `usuarios`: Perfiles de usuario vinculados al UID de Firebase Auth.
11. `chacras`: Terrenos o parcelas georreferenciadas de cada caficultor.

### 4.2. Patrón Snapshot JSONB Inmutable en `calculos_suelo`
En investigaciones científicas, los análisis de laboratorio y las recomendaciones agronómicas calculadas **deben permanecer inmutables en el tiempo** para garantizar la reproducibilidad experimental (auditoría retrospectiva). Si una tabla de catálogo actualizase su factor de eficiencia en el futuro, no debe alterarse el cálculo que un agricultor recibió meses atrás.

Por ende, la tabla `calculos_suelo` implementa el **Patrón Snapshot**:
- `datos_entrada (JSONB)`: Captura exacta de todos los parámetros físico-químicos ingresados.
- `resultados (JSONB)`: Captura inmutable de los balances, dosis, costos y alertas generadas.
- **Optimización de Consulta:** Se crearon índices GIN especializados en PostgreSQL:
  ```sql
  CREATE INDEX idx_calculos_resultados_gin ON calculos_suelo USING GIN (resultados);
  CREATE INDEX idx_calculos_datos_gin ON calculos_suelo USING GIN (datos_entrada);
  ```

---

## 5. Arquitectura Offline-First y Sincronización Asíncrona Diferida

Para garantizar el funcionamiento sin cobertura celular, la aplicación opera bajo el principio **Offline-First**:

```
                       ┌─────────────────────────┐
                       │ Interacción del Usuario │
                       │ (Crear Parcela/Cálculo) │
                       └────────────┬────────────┘
                                    │
                                    ▼
                          ¿Hay Conexión a Red?
                             /             \
                      [SÍ]  /               \  [NO]
                           ▼                 ▼
             ┌─────────────────────┐   ┌─────────────────────────┐
             │ Inserción Directa   │   │ Almacenamiento Local    │
             │ en Supabase Cloud   │   │ con ID Temporal (-Time) │
             └──────────┬──────────┘   │ syncStatus = 'PENDING'  │
                        │              └────────────┬────────────┘
                        ▼                           │
             ┌─────────────────────┐                │
             │ Cachear en Local    │                │
             │ syncStatus='SYNCED' │                │
             └─────────────────────┘                │
                                                    │
                                     [Reconexión a Internet]
                                     (Evento window 'online')
                                                    │
                                                    ▼
                                       ┌─────────────────────────┐
                                       │ SyncService.syncAll()   │
                                       │ 1. Push Chacras PEND    │
                                       │ 2. Cascada IDs (- → +)  │
                                       │ 3. Push Cálculos PEND   │
                                       │ 4. Actualizar Badges UI │
                                       └─────────────────────────┘
```

### 5.1. Estrategia de IDs Temporales Negativos
Cuando el usuario crea una parcela sin internet, el sistema le asigna un identificador negativo:
$$\text{tempId} = -\text{Date.now()}$$
Esto evita colisiones con la secuencia de auto-incremento `bigint` de PostgreSQL en Supabase. Cuando el dispositivo vuelve a tener internet:
1. `SyncService` inserta la parcela pendiente en Supabase.
2. Supabase devuelve el `id` definitivo autoincremental positivo (ej. `42`).
3. El servicio local actualiza la parcela y reemplaza automáticamente el `chacraId` de todos los análisis asociados en cascada antes de enviarlos a la nube.

---

## 6. Seguridad y Gobernanza (Row Level Security & SMS OTP)

1. **Autenticación sin Contraseña:** Los agricultores inician sesión mediante su número de celular vía SMS OTP gestionado por Firebase Phone Auth. Esto elimina el problema común de olvido de contraseñas complejas en el ámbito rural.
2. **Row Level Security (RLS) en PostgreSQL:** Cada usuario solo tiene permisos de lectura, escritura y eliminación sobre sus propias parcelas y análisis (`auth.uid() = usuario_id`).

---

## 7. Balance de Costos y Viabilidad Económica ($0.00 / mes)

| Componente | Nivel Gratuito (Free Tier) | Consumo Estimado del Proyecto | Costo Mensual |
| :--- | :--- | :--- | :--- |
| **Computación de Cálculo** | Client-Side (Procesador del smartphone) | Ilimitado | **$0.00** |
| **Supabase Database** | 500 MB PostgreSQL + 50,000 usuarios activos | ~15 MB para 5,000 análisis | **$0.00** |
| **Firebase Auth (Phone SMS)** | 10,000 verificaciones SMS gratuitas / mes | < 500 verificaciones / mes | **$0.00** |
| **Frontend Hosting / APK** | Ionic Capacitor APK nativo + PWA estática | Distribuible vía PlayStore o APK directo | **$0.00** |
| **TOTAL** | — | — | **$0.00 USD** |
