-- Limpiar tablas problemáticas para migración a Firebase Auth
DROP TABLE IF EXISTS calculo_suelo CASCADE;
DROP TABLE IF EXISTS chacra CASCADE;
DROP TABLE IF EXISTS usuario CASCADE;

-- Recrear tabla usuario con estructura Firebase
CREATE TABLE usuario (
    id SERIAL PRIMARY KEY,
    "firebaseUid" VARCHAR UNIQUE NOT NULL,
    email VARCHAR NULL,
    nombre VARCHAR NULL,
    telefono VARCHAR NULL,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);