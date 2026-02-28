-- Database Schema for Academic Assignment Roulette (MariaDB)
CREATE DATABASE IF NOT EXISTS tesis_ruleta;
USE tesis_ruleta;
-- 1. Tables for Users and Roles
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    -- 'admin', 'profesor', 'alumno'
    descripcion VARCHAR(255)
);
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE,
    rol_id INT NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE RESTRICT
);
-- 2. Specific Tables for Professors and Students (linked to Users)
CREATE TABLE IF NOT EXISTS profesores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL UNIQUE,
    nombre_completo VARCHAR(100) NOT NULL,
    especialidad VARCHAR(100),
    max_carga INT DEFAULT 10,
    -- Maximum number of students assigned per event type
    activo BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS alumnos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL UNIQUE,
    nombre_completo VARCHAR(100) NOT NULL,
    carnet VARCHAR(20) NOT NULL UNIQUE,
    carrera VARCHAR(100),
    activo BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);
-- 3. Event Configuration
CREATE TABLE IF NOT EXISTS tipos_evento (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    -- 'Tesis', 'Privado', 'Maestria'
    descripcion VARCHAR(255)
);
CREATE TABLE IF NOT EXISTS periodos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    -- e.g., '2024-1', '2024-2'
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    activo BOOLEAN DEFAULT TRUE
);
-- 4. Assignments (The Core Table)
CREATE TABLE IF NOT EXISTS asignaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    alumno_id INT NOT NULL,
    profesor_id INT NOT NULL,
    tipo_evento_id INT NOT NULL,
    periodo_id INT NOT NULL,
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    asignado_por_usuario_id INT,
    -- ID of the admin who ran the roulette
    FOREIGN KEY (alumno_id) REFERENCES alumnos(id) ON DELETE CASCADE,
    FOREIGN KEY (profesor_id) REFERENCES profesores(id) ON DELETE RESTRICT,
    FOREIGN KEY (tipo_evento_id) REFERENCES tipos_evento(id) ON DELETE RESTRICT,
    FOREIGN KEY (periodo_id) REFERENCES periodos(id) ON DELETE RESTRICT,
    FOREIGN KEY (asignado_por_usuario_id) REFERENCES usuarios(id) ON DELETE
    SET NULL,
        -- CONSTRAINT CRÍTICO (ANTI-FRAUDE):
        -- Un alumno NO puede tener dos asignaciones para el mismo tipo de evento en el mismo periodo.
        -- Esto previene, por ejemplo, tener dos tesis en el 2024-1.
        -- Si la restricción es "un alumno no puede estar en dos eventos simultáneos" (ni tesis ni privado a la vez),
        -- entonces el UNIQUE debe ser (alumno_id, periodo_id).
        -- Opción A: Restricción por tipo de evento (un alumno solo una tesis por periodo)
        -- UNIQUE KEY uk_alumno_periodo_evento (alumno_id, periodo_id, tipo_evento_id)
        -- Opción B: Restricción global por periodo (un alumno solo UNA cosa a la vez por periodo)
        -- Según el requisito: "Un alumno no puede estar asignado a dos eventos simultáneos"
        UNIQUE KEY uk_alumno_periodo_global (alumno_id, periodo_id)
);
-- 5. Audit Log (Optional but recommended)
CREATE TABLE IF NOT EXISTS auditoria_asignaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    accion VARCHAR(50) NOT NULL,
    -- 'CREAR', 'ELIMINAR', 'MODIFICAR'
    asignacion_id INT,
    usuario_responsable_id INT,
    detalles TEXT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Insert inital data for roles and event types
INSERT IGNORE INTO roles (nombre, descripcion)
VALUES ('admin', 'Administrador del sistema'),
    ('profesor', 'Docente evaluador'),
    ('alumno', 'Estudiante');
INSERT IGNORE INTO tipos_evento (nombre, descripcion)
VALUES ('Tesis', 'Trabajo de graduación'),
    ('Privado', 'Examen privado'),
    ('Maestria', 'Tesis de maestría');