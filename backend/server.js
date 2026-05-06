// @ts-nocheck

/**
 * Configuración del servidor principal para la tesis de sorteos - UMG.
 * Aquí conectamos el servidor de Node con la base de datos MariaDB
 * y definimos todas las rutas que usa la aplicación.
 */

const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
require("dotenv").config();

// Creamos la aplicación con Express
const app = express();

// El puerto donde va a correr el servidor (por defecto el 3000)
const PORT = process.env.PORT || 3000;

// =========================================================
// CONFIGURACIONES INICIALES (MIDDLEWARES)
// =========================================================

// Esto sirve para que Angular se pueda comunicar con el servidor sin problemas de permisos
app.use(cors());

// Para que el servidor pueda entender y leer los datos que le enviamos en formato JSON
app.use(express.json());

// =========================================================
// CONEXIÓN A LA BASE DE DATOS
// =========================================================

// Configuramos la conexión a la base de datos MariaDB
// Usamos un 'pool' para que las conexiones se manejen de forma eficiente
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "tesis_ruleta",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Verificamos si la conexión con la base de datos funciona al iniciar el servidor
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log("✅ Conectado exitosamente a la base de datos MariaDB:", process.env.DB_NAME);
    // Soltamos la conexión para que otros la puedan usar
    connection.release();
  } catch (error) { 
    console.error("❌ No se pudo conectar a la base de datos:", error.message); 
  }
})();

// =========================================================
// RUTAS DEL SERVIDOR (API)
// =========================================================

// Ruta básica para ver si el servidor está funcionando correctamente
app.get("/", (req, res) => res.json({ message: "El servidor de la ruleta está activo" }));

// Ruta para traer a todos los usuarios de la base de datos
app.get("/api/usuarios", async (req, res) => {
  try { 
    const [rows] = await pool.query("SELECT * FROM usuarios"); 
    res.json(rows); 
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
});

// Ruta para el Login: revisa si el correo y la contraseña coinciden
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const query = "SELECT * FROM usuarios WHERE email = ? AND password_hash = ?";
    const [rows] = await pool.query(query, [email, password]);
    
    if (rows.length > 0) {
      res.json({ success: true, message: "Bienvenido al sistema", user: rows[0] });
    } else {
      res.status(401).json({ success: false, message: "Correo o contraseña incorrectos" });
    }
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
});

// Ruta para traer todos los sorteos guardados (para los reportes de Excel)
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
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "No se pudieron obtener los datos de los sorteos" });
  }
});

// Ruta para guardar los resultados del sorteo
app.post("/api/asignaciones", async (req, res) => {
  const { profesor_nombre, alumnos, tipo_evento_id, es_tesis, alumno, profesores } = req.body; 
  // Definimos si es Tesis o Privado/Seminario
  const final_evento = tipo_evento_id || (es_tesis ? 3 : 1);

  const connection = await pool.getConnection();
  try {
    // Iniciamos una transacción para que se guarde todo bien o no se guarde nada
    await connection.beginTransaction(); 

    if (es_tesis) {
      // Si es Tesis, guardamos a los 3 jurados (Presidente y Vocales) para el alumno
      const roles = ["Presidente", "Vocal 1", "Vocal 2"];
      for (let i = 0; i < profesores.length; i++) {
        const nombreConRol = `${profesores[i].nombre_completo || 'Catedrático'} (${roles[i]})`; 
        await connection.query(
          "INSERT INTO asignaciones (profesor_nombre, alumno_carnet, alumno_nombre, tipo_evento_id) VALUES (?, ?, ?, ?)",
          [nombreConRol, alumno.carnet, alumno.nombre_completo, final_evento]
        );
      }
    } else {
      // Si es Privado o Seminario, guardamos al catedrático con su grupo de alumnos
      const nombreLimpio = profesor_nombre || 'Catedrático';
      for (let alu of alumnos) {
        await connection.query(
          "INSERT INTO asignaciones (profesor_nombre, alumno_carnet, alumno_nombre, tipo_evento_id) VALUES (?, ?, ?, ?)",
          [nombreLimpio, alu.carnet, alu.nombre_completo, final_evento]
        );
      }
    }

    // Confirmamos los cambios en la base de datos
    await connection.commit(); 
    res.json({ success: true });
  } catch (error) {
    // Si algo falla, deshacemos lo que se intentó guardar para evitar datos incompletos
    await connection.rollback(); 
    console.error("Error al guardar:", error);
    res.status(500).json({ error: "No se pudieron guardar los resultados del sorteo" });
  } finally { 
    // Liberamos la conexión de vuelta al pool
    connection.release(); 
  }
});

// Ruta para borrar un grupo de sorteos usando la fecha como referencia
app.delete("/api/asignaciones/lote", async (req, res) => {
  const { fecha } = req.query;
  try {
    const query = "DELETE FROM asignaciones WHERE DATE_FORMAT(fecha_asignacion, '%d/%m/%Y %H:%i') = ?";
    await pool.query(query, [fecha]);
    res.json({ success: true });
  } catch (error) { 
    res.status(500).json({ error: "Error al intentar borrar el registro" }); 
  }
});

// Ruta para traer las modalidades (Privado, Seminario, Tesis) desde la base de datos
app.get("/api/tipos-evento", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM tipos_evento");
    res.json(rows);
  } catch (error) { 
    res.status(500).json({ error: "Error al cargar las modalidades de sorteo" }); 
  }
});

// Iniciamos el servidor y lo dejamos escuchando peticiones
app.listen(PORT, () => {
  console.log(`🚀 Servidor funcionando en http://localhost:${PORT}`);
});