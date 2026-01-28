-- =====================================================
-- SEEDER PARA VISOR CEMENTERIO - UNORICO SAMASHUNCHIK
-- Centro Sagrado Ancestral o Cementerio Indígena de Otavalo
-- =====================================================
-- IMPORTANTE: Este archivo NO elimina datos existentes.
-- Solo inserta datos de ejemplo si las tablas están vacías.
-- Ejecutar en Supabase SQL Editor o mediante CLI.
-- =====================================================

-- =====================================================
-- 1. TABLA: bloques_geom (Bloques del cementerio)
-- =====================================================
-- Esta tabla almacena los bloques/sectores del cementerio
-- Los IDs deben coincidir con los de GeoServer para que 
-- el filtrado y visualización funcionen correctamente.

INSERT INTO bloques_geom (id, codigo, nombre, sector)
SELECT * FROM (VALUES
    -- Sector A
    (1, 'B-01', 'Bloque 01', 'Sector A'),
    (2, 'B-02', 'Bloque 02', 'Sector A'),
    (3, 'B-03', 'Bloque 03', 'Sector A'),
    (4, 'B-04', 'Bloque 04', 'Sector A'),
    -- Sector B
    (5, 'B-05', 'Bloque 05', 'Sector B'),
    (6, 'B-06', 'Bloque 06', 'Sector B'),
    (7, 'B-07', 'Bloque 07', 'Sector B'),
    (8, 'B-08', 'Bloque 08', 'Sector B'),
    -- Sector C
    (9, 'B-09', 'Bloque 09', 'Sector C'),
    (10, 'B-10', 'Bloque 10', 'Sector C'),
    (11, 'B-11', 'Bloque 11', 'Sector C'),
    (12, 'B-12', 'Bloque 12', 'Sector C'),
    -- Sector D
    (13, 'B-13', 'Bloque 13', 'Sector D'),
    (14, 'B-14', 'Bloque 14', 'Sector D'),
    (15, 'B-15', 'Bloque 15', 'Sector D'),
    (16, 'B-16', 'Bloque 16', 'Sector D')
) AS v(id, codigo, nombre, sector)
WHERE NOT EXISTS (SELECT 1 FROM bloques_geom LIMIT 1);


-- =====================================================
-- 2. TABLA: nichos_geom (Nichos del cementerio)
-- =====================================================
-- Cada nicho pertenece a un bloque y tiene un estado:
-- - 'disponible': Nicho libre para asignar
-- - 'ocupado': Nicho con un difunto asignado
-- - 'reservado': Nicho apartado pero sin ocupar

INSERT INTO nichos_geom (id, codigo, estado, bloques_geom_id)
SELECT * FROM (VALUES
    -- Nichos del Bloque 01 (Sector A)
    (1, 'N-A01-001', 'ocupado', 1),
    (2, 'N-A01-002', 'ocupado', 1),
    (3, 'N-A01-003', 'disponible', 1),
    (4, 'N-A01-004', 'disponible', 1),
    (5, 'N-A01-005', 'reservado', 1),
    
    -- Nichos del Bloque 02 (Sector A)
    (6, 'N-A02-001', 'ocupado', 2),
    (7, 'N-A02-002', 'disponible', 2),
    (8, 'N-A02-003', 'disponible', 2),
    (9, 'N-A02-004', 'ocupado', 2),
    (10, 'N-A02-005', 'disponible', 2),
    
    -- Nichos del Bloque 03 (Sector A)
    (11, 'N-A03-001', 'ocupado', 3),
    (12, 'N-A03-002', 'disponible', 3),
    (13, 'N-A03-003', 'reservado', 3),
    (14, 'N-A03-004', 'disponible', 3),
    (15, 'N-A03-005', 'ocupado', 3),
    
    -- Nichos del Bloque 05 (Sector B)
    (16, 'N-B05-001', 'ocupado', 5),
    (17, 'N-B05-002', 'disponible', 5),
    (18, 'N-B05-003', 'ocupado', 5),
    (19, 'N-B05-004', 'disponible', 5),
    (20, 'N-B05-005', 'reservado', 5),
    
    -- Nichos del Bloque 06 (Sector B)
    (21, 'N-B06-001', 'disponible', 6),
    (22, 'N-B06-002', 'ocupado', 6),
    (23, 'N-B06-003', 'disponible', 6),
    (24, 'N-B06-004', 'ocupado', 6),
    (25, 'N-B06-005', 'disponible', 6),
    
    -- Nichos del Bloque 09 (Sector C)
    (26, 'N-C09-001', 'ocupado', 9),
    (27, 'N-C09-002', 'ocupado', 9),
    (28, 'N-C09-003', 'disponible', 9),
    (29, 'N-C09-004', 'reservado', 9),
    (30, 'N-C09-005', 'disponible', 9),
    
    -- Nichos del Bloque 13 (Sector D)
    (31, 'N-D13-001', 'ocupado', 13),
    (32, 'N-D13-002', 'disponible', 13),
    (33, 'N-D13-003', 'ocupado', 13),
    (34, 'N-D13-004', 'disponible', 13),
    (35, 'N-D13-005', 'reservado', 13)
) AS v(id, codigo, estado, bloques_geom_id)
WHERE NOT EXISTS (SELECT 1 FROM nichos LIMIT 1);


-- =====================================================
-- 3. TABLA: fallecidos (Datos de los difuntos)
-- =====================================================
-- Información personal de los fallecidos registrados
-- en el cementerio.

INSERT INTO fallecidos (id, nombres, apellidos, cedula, fecha_defuncion, responsable)
SELECT * FROM (VALUES
    -- Difuntos de ejemplo (datos ficticios para pruebas)
    (1, 'José María', 'Quispe Morales', '1001234567', '2020-03-15', 'María Quispe'),
    (2, 'Rosa Elena', 'Cachimuel Lema', '1002345678', '2019-08-22', 'Carlos Cachimuel'),
    (3, 'Manuel Antonio', 'Maldonado Túquerres', '1003456789', '2021-01-10', 'Ana Maldonado'),
    (4, 'Carmen Lucía', 'Otavalo Conejo', '1004567890', '2018-12-05', 'Pedro Otavalo'),
    (5, 'Luis Alberto', 'Cotacachi Moreta', '1005678901', '2022-06-18', 'Rosa Cotacachi'),
    (6, 'María Dolores', 'Perugachi Alta', '1006789012', '2020-09-30', 'Juan Perugachi'),
    (7, 'Francisco Javier', 'Muenala Tontaquimba', '1007890123', '2019-04-12', 'Lucía Muenala'),
    (8, 'Ana María', 'Yamberla Quinchuquí', '1008901234', '2021-11-25', 'Miguel Yamberla'),
    (9, 'Pedro Pablo', 'Camuendo Tabango', '1009012345', '2023-02-08', 'Elena Camuendo'),
    (10, 'Juana Mercedes', 'Fichamba Anrango', '1000123456', '2022-07-14', 'Roberto Fichamba'),
    (11, 'Carlos Eduardo', 'Lema Guaján', '1001112233', '2020-05-20', 'Marta Lema'),
    (12, 'Margarita Isabel', 'Conejo Sarabino', '1002223344', '2019-10-03', 'José Conejo'),
    (13, 'Antonio José', 'Morales Quilumbaquín', '1003334455', '2021-08-17', 'Patricia Morales'),
    (14, 'Teresa del Carmen', 'Alta Tituaña', '1004445566', '2018-06-29', 'Diego Alta')
) AS v(id, nombres, apellidos, cedula, fecha_defuncion, responsable)
WHERE NOT EXISTS (SELECT 1 FROM fallecidos LIMIT 1);


-- =====================================================
-- 4. TABLA: fallecido_nicho (Relación Fallecido-Nicho)
-- =====================================================
-- Tabla intermedia que relaciona cada fallecido con su nicho.
-- Un nicho puede tener varios fallecidos (histórico) pero
-- solo uno "activo" a la vez.

INSERT INTO fallecido_nicho (fallecido_id, nicho_id)
SELECT * FROM (VALUES
    -- Fallecido 1 en Nicho N-A01-001
    (1, 1),
    -- Fallecido 2 en Nicho N-A01-002
    (2, 2),
    -- Fallecido 3 en Nicho N-A02-001
    (3, 6),
    -- Fallecido 4 en Nicho N-A02-004
    (4, 9),
    -- Fallecido 5 en Nicho N-A03-001
    (5, 11),
    -- Fallecido 6 en Nicho N-A03-005
    (6, 15),
    -- Fallecido 7 en Nicho N-B05-001
    (7, 16),
    -- Fallecido 8 en Nicho N-B05-003
    (8, 18),
    -- Fallecido 9 en Nicho N-B06-002
    (9, 22),
    -- Fallecido 10 en Nicho N-B06-004
    (10, 24),
    -- Fallecido 11 en Nicho N-C09-001
    (11, 26),
    -- Fallecido 12 en Nicho N-C09-002
    (12, 27),
    -- Fallecido 13 en Nicho N-D13-001
    (13, 31),
    -- Fallecido 14 en Nicho N-D13-003
    (14, 33)
) AS v(fallecido_id, nicho_id)
WHERE NOT EXISTS (SELECT 1 FROM fallecido_nicho LIMIT 1);


-- =====================================================
-- 5. ACTUALIZAR SECUENCIAS (Para evitar conflictos de ID)
-- =====================================================
-- Después de insertar datos con IDs específicos, 
-- actualizamos las secuencias para que los próximos
-- INSERTs automáticos no generen conflictos.

SELECT setval('bloques_geom_id_seq', COALESCE((SELECT MAX(id) FROM bloques_geom), 1));
SELECT setval('nichos_id_seq', COALESCE((SELECT MAX(id) FROM nichos), 1));
SELECT setval('fallecidos_id_seq', COALESCE((SELECT MAX(id) FROM fallecidos), 1));


-- =====================================================
-- FIN DEL SEEDER
-- =====================================================
-- Para ejecutar este seeder:
-- 1. Abre Supabase Dashboard > SQL Editor
-- 2. Copia y pega todo este contenido
-- 3. Ejecuta el script
--
-- O mediante CLI de Supabase:
-- supabase db reset (esto ejecuta seed.sql automáticamente)
-- =====================================================
