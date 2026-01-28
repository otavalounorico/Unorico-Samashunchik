-- =====================================================
-- SCRIPT PARA LIMPIAR Y REINICIAR DATOS (Opcional)
-- VISOR CEMENTERIO - UNORICO SAMASHUNCHIK
-- =====================================================
-- ⚠️ ADVERTENCIA: Este script ELIMINA todos los datos
-- de las tablas. Usar solo cuando sea necesario reiniciar
-- completamente la base de datos.
-- =====================================================

-- Desactivar temporalmente las restricciones de FK
SET session_replication_role = 'replica';

-- Limpiar tablas en orden (respetando dependencias)
TRUNCATE TABLE fallecido_nicho CASCADE;
TRUNCATE TABLE fallecidos CASCADE;
TRUNCATE TABLE nichos CASCADE;
TRUNCATE TABLE bloques_geom CASCADE;

-- Reactivar restricciones de FK
SET session_replication_role = 'origin';

-- Reiniciar secuencias a 1
ALTER SEQUENCE IF EXISTS bloques_geom_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS nichos_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS fallecidos_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS fallecido_nicho_id_seq RESTART WITH 1;

-- =====================================================
-- Después de ejecutar este script, ejecuta seed.sql
-- para volver a poblar las tablas con datos de prueba.
-- =====================================================
