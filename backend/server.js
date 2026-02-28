const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "tesis_ruleta",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Test Database Connection
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log("✅ Conectado exitosamente a la base de datos MariaDB:", process.env.DB_NAME);
    connection.release();
  } catch (error) {
    console.error("❌ Error al conectar a la base de datos:", error.message);
  }
})();

// Basic Route
app.get("/", (req, res) => {
  res.json({ message: "API de Ruleta de Asignación Académica funcionando 🚀" });
});

// --- RUTA: Obtener Usuarios ---
app.get("/api/usuarios", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM usuarios");
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// RUTAS PARA PROFESORES (CRUD)
// ==========================================

// 1. OBTENER todos los profesores
app.get("/api/profesores", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM profesores ORDER BY id DESC");
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener los profesores" });
  }
});

// 2. CREAR un nuevo profesor
app.post("/api/profesores", async (req, res) => {
  const { nombre_completo, especialidad, max_carga, usuario_id } = req.body;

  try {
    // --- NUEVA VALIDACIÓN: Evitar duplicados ---
    const [existentes] = await pool.query(
      "SELECT id FROM profesores WHERE nombre_completo = ?",
      [nombre_completo]
    );

    if (existentes.length > 0) {
      // Si ya existe, detenemos todo y mandamos un error 400 (Bad Request)
      return res.status(400).json({ error: "Ya existe un catedrático registrado con este nombre exacto." });
    }
    // -------------------------------------------

    const [result] = await pool.query(
      "INSERT INTO profesores (usuario_id, nombre_completo, especialidad, max_carga, activo) VALUES (?, ?, ?, ?, 1)",
      [usuario_id || null, nombre_completo, especialidad, max_carga || 10]
    );
    res.json({ success: true, message: "Profesor agregado exitosamente", id: result.insertId });
  } catch (error) {
    console.error("Error al insertar profesor:", error);
    res.status(500).json({ error: "Error al guardar el profesor", detalle: error.message });
  }
});

// 3. ELIMINAR un profesor
app.delete("/api/profesores/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM profesores WHERE id = ?", [id]);
    res.json({ success: true, message: "Profesor eliminado" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar el profesor" });
  }
});

// ==========================================
// RUTA DE LOGIN
// ==========================================
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const [rows] = await pool.query(
      "SELECT * FROM usuarios WHERE email = ? AND password_hash = ?",
      [email, password]
    );

    if (rows.length > 0) {
      const user = rows[0];
      res.json({ success: true, message: "Bienvenido", user });
    } else {
      res.status(401).json({ success: false, message: "Credenciales incorrectas" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Verify Environment variables
if (!process.env.DB_HOST) {
  console.warn(
    "⚠️  Advertencia: Las variables de entorno de la base de datos no están configuradas completamente.",
  );
}

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});