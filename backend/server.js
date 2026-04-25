const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// MIDDLEWARES Y CONEXIÓN
// ==========================================
app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "tesis_ruleta",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

(async () => {
  try {
    const connection = await pool.getConnection();
    console.log("✅ Conectado exitosamente a la base de datos MariaDB:", process.env.DB_NAME);
    connection.release();
  } catch (error) { console.error("❌ Error al conectar a la base de datos:", error.message); }
})();

// ==========================================
// RUTAS
// ==========================================
app.get("/", (req, res) => res.json({ message: "API de Ruleta funcionando" }));

app.get("/api/usuarios", async (req, res) => {
  try { const [rows] = await pool.query("SELECT * FROM usuarios"); res.json(rows); } 
  catch (error) { res.status(500).json({ error: error.message }); }
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await pool.query("SELECT * FROM usuarios WHERE email = ? AND password_hash = ?", [email, password]);
    if (rows.length > 0) res.json({ success: true, message: "Bienvenido", user: rows[0] });
    else res.status(401).json({ success: false, message: "Credenciales incorrectas" });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// ==========================================
// OBTENER ASIGNACIONES (DATOS PLANOS PARA ANGULAR)
// ==========================================
app.get("/api/asignaciones", async (req, res) => {
  try {
    const query = `
      SELECT 
        COALESCE(te.nombre, 'Tesis') AS modalidad,
        a.profesor_nombre,
        CONCAT(a.alumno_carnet, ' - ', a.alumno_nombre) AS alumno_info,
        DATE_FORMAT(a.fecha_asignacion, '%d/%m/%Y %H:%i') AS fecha
      FROM asignaciones a
      LEFT JOIN tipos_evento te ON a.tipo_evento_id = te.id
      ORDER BY a.fecha_asignacion DESC
    `;
    const [rows] = await pool.query(query);
    res.json(rows); // Angular se encarga de estructurar el Excel y agruparlo
  } catch (error) {
    res.status(500).json({ error: "Error al obtener reportes" });
  }
});

// ==========================================
// GUARDAR ASIGNACIONES
// ==========================================
app.post("/api/asignaciones", async (req, res) => {
  const { profesor_nombre, alumnos, tipo_evento_id, es_tesis, alumno, profesores } = req.body; 
  const final_evento = tipo_evento_id || (es_tesis ? 3 : 1);

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction(); 

    if (es_tesis) {
      const roles = ["Presidente", "Vocal 1", "Vocal 2"];
      for (let i = 0; i < profesores.length; i++) {
        const nombreConRol = `${profesores[i].nombre_completo || 'Catedrático'} (${roles[i]})`; 
        await connection.query(
          "INSERT INTO asignaciones (profesor_nombre, alumno_carnet, alumno_nombre, tipo_evento_id) VALUES (?, ?, ?, ?)",
          [nombreConRol, alumno.carnet, alumno.nombre_completo, final_evento]
        );
      }
    } else {
      const nombreLimpio = profesor_nombre || 'Catedrático';
      for (let alu of alumnos) {
        await connection.query(
          "INSERT INTO asignaciones (profesor_nombre, alumno_carnet, alumno_nombre, tipo_evento_id) VALUES (?, ?, ?, ?)",
          [nombreLimpio, alu.carnet, alu.nombre_completo, final_evento]
        );
      }
    }

    await connection.commit(); 
    res.json({ success: true });
  } catch (error) {
    await connection.rollback(); 
    console.error(error);
    res.status(500).json({ error: "Error al guardar en la BD" });
  } finally { connection.release(); }
});

// ==========================================
// ELIMINAR LOTE ESPECÍFICO
// ==========================================
app.delete("/api/asignaciones/lote", async (req, res) => {
  const { fecha } = req.query;
  try {
    await pool.query("DELETE FROM asignaciones WHERE DATE_FORMAT(fecha_asignacion, '%d/%m/%Y %H:%i') = ?", [fecha]);
    res.json({ success: true });
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
});

app.delete("/api/asignaciones/limpiar-todo", async (req, res) => {
  try {
    await pool.query("TRUNCATE TABLE asignaciones");
    res.json({ success: true });
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
});

app.get("/api/tipos-evento", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM tipos_evento");
    res.json(rows);
  } catch (error) { res.status(500).json({ error: "Error al obtener tipos de evento" }); }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});