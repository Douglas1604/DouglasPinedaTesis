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
  res.json({ message: "API de Ruleta de Asignación Académica funcionando" });
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


// ==========================================
// RUTA PARA OBTENER ASIGNACIONES (REPORTES)
// ==========================================
app.get("/api/asignaciones", async (req, res) => {
  try {
    const query = `
      SELECT 
        a.id, 
        a.profesor_nombre, 
        a.alumno_carnet, 
        a.alumno_nombre, 
        COALESCE(te.nombre, 'Tesis') AS modalidad, 
        COALESCE(p.nombre, 'Semestre Actual') AS periodo, 
        DATE_FORMAT(a.fecha_asignacion, '%d/%m/%Y') AS fecha_formateada
      FROM asignaciones a
      LEFT JOIN tipos_evento te ON a.tipo_evento_id = te.id
      LEFT JOIN periodos p ON a.periodo_id = p.id
      ORDER BY a.fecha_asignacion DESC
    `;
    const [rows] = await pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener asignaciones:", error);
    res.status(500).json({ error: "Error al obtener los reportes" });
  }
});

// ==========================================
// RUTA PARA GUARDAR ASIGNACIONES (NORMAL Y TESIS)
// ==========================================
app.post("/api/asignaciones", async (req, res) => {
  const { profesor_nombre, alumnos, tipo_evento_id, periodo_id, es_tesis, alumno, profesores } = req.body; 

  // Salvavidas: Si por alguna razón no llega el ID, forzamos los correctos
  const final_evento = tipo_evento_id || (es_tesis ? 3 : 1);
  const final_periodo = periodo_id || 1;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction(); 

    if (es_tesis) {
      const roles = ["Presidente", "Vocal 1", "Vocal 2"];
      for (let i = 0; i < profesores.length; i++) {
        const prof = profesores[i];
        const nombreLimpio = prof.nombre_completo ? prof.nombre_completo : 'Catedrático sin nombre';
        const nombreConRol = `${nombreLimpio} (${roles[i]})`; 
        
        await connection.query(
          "INSERT INTO asignaciones (profesor_nombre, alumno_carnet, alumno_nombre, tipo_evento_id, periodo_id) VALUES (?, ?, ?, ?, ?)",
          [nombreConRol, alumno.carnet, alumno.nombre_completo, final_evento, final_periodo]
        );
      }
    } else {
      const nombreLimpio = profesor_nombre ? profesor_nombre : 'Catedrático sin nombre';
      for (let alu of alumnos) {
        await connection.query(
          "INSERT INTO asignaciones (profesor_nombre, alumno_carnet, alumno_nombre, tipo_evento_id, periodo_id) VALUES (?, ?, ?, ?, ?)",
          [nombreLimpio, alu.carnet, alu.nombre_completo, final_evento, final_periodo]
        );
      }
    }

    await connection.commit(); 
    res.json({ success: true, message: "Asignación guardada exitosamente" });
  } catch (error) {
    await connection.rollback(); 
    console.error("Error al guardar asignaciones:", error);
    res.status(500).json({ error: "Error al guardar en la base de datos" });
  } finally {
    connection.release();
  }
});

// ==========================================
// RUTAS PARA PERÍODOS (CRUD CON BORRADO LÓGICO)
// ==========================================
app.get("/api/periodos", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM periodos ORDER BY id DESC");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener los períodos" });
  }
});

app.post("/api/periodos", async (req, res) => {
  const { nombre } = req.body;
  try {
    const [existentes] = await pool.query("SELECT id FROM periodos WHERE nombre = ?", [nombre]);
    if (existentes.length > 0) return res.status(400).json({ error: "Ya existe un período con este nombre." });

    const [result] = await pool.query("INSERT INTO periodos (nombre, activo) VALUES (?, 1)", [nombre]);
    res.json({ success: true, message: "Período agregado", id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: "Error al guardar el período" });
  }
});

app.put("/api/periodos/:id", async (req, res) => {
  const { id } = req.params;
  const { nombre, activo } = req.body;
  try {
    const [existentes] = await pool.query("SELECT id FROM periodos WHERE nombre = ? AND id != ?", [nombre, id]);
    if (existentes.length > 0) return res.status(400).json({ error: "Ya existe otro período con este nombre." });

    await pool.query("UPDATE periodos SET nombre = ?, activo = ? WHERE id = ?", [nombre, activo, id]);
    res.json({ success: true, message: "Período actualizado" });
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar" });
  }
});

app.delete("/api/periodos/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("UPDATE periodos SET activo = 0 WHERE id = ?", [id]);
    res.json({ success: true, message: "Período desactivado correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al desactivar el período" });
  }
});

// ==========================================
// RUTA EXTRA: LECTURA DE TIPOS DE EVENTO
// ==========================================
app.get("/api/tipos-evento", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM tipos_evento");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener tipos de evento" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});