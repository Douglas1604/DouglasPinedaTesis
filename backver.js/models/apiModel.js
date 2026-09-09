const db = require("../config/config");

const ApiModel = {
  lastRow: (table, idColumn, callback) => {
    const query = `SELECT * FROM ?? ORDER BY ?? DESC LIMIT 1`;
    db.query(query, [table, idColumn], (err, result) => {
      if (err) return callback(err, null);
      return callback(null, result[0]);
    });
  },

  getRowById: (table, idColumn, id, callback) => {
    const query = `SELECT * FROM ?? WHERE ?? = ? LIMIT 1`;
    db.query(query, [table, idColumn, id], (err, result) => {
      if (err) return callback(err, null);
      return callback(null, result[0]);
    });
  },

  getUserByEmail: (email, callback) => {
    const query = `SELECT * FROM usuarios WHERE email = ? LIMIT 1`;
    db.query(query, [email], (err, result) => {
      if (err) return callback(err, null);
      return callback(null, result[0]);
    });
  },

  getUserById: (id, callback) => {
    const query = `SELECT * FROM usuarios WHERE idUsuarios = ? LIMIT 1`;
    db.query(query, [id], (err, result) => {
      if (err) {
        console.error("Error en la consulta SQL:", err);
        return callback(err, null);
      }
      console.log("Resultado de la consulta:", result);
      return callback(null, result[0]);
    });
  },

  searchUsuario: (search, callback) => {
    const query = `SELECT * FROM usuarios WHERE nome LIKE ? AND situacao = 1 LIMIT 5`;
    db.query(query, [`%${search}%`], (err, result) => {
      if (err) return callback(err, null);
      return callback(null, result);
    });
  },

  get: (table, columns, where, limit, offset, callback) => {
    let query = `SELECT ${columns} FROM ?? ${
      where ? `WHERE ${where}` : ""
    } ORDER BY idUsuarios DESC LIMIT ? OFFSET ?`;
    db.query(query, [table, limit, offset], (err, result) => {
      if (err) return callback(err, null);
      return callback(null, result);
    });
  },

  add: (table, data, callback) => {
    const query = `INSERT INTO ?? SET ?`;
    db.query(query, [table, data], (err, result) => {
      if (err) return callback(err, null);
      return callback(null, result);
    });
  },

  edit: (table, data, fieldID, ID, callback) => {
    const query = `UPDATE ?? SET ? WHERE ?? = ?`;
    db.query(query, [table, data, fieldID, ID], (err, result) => {
      if (err) return callback(err, null);
      return callback(null, result);
    });
  },

  delete: (table, fieldID, ID, callback) => {
    const query = `DELETE FROM ?? WHERE ?? = ?`;
    db.query(query, [table, fieldID, ID], (err, result) => {
      if (err) return callback(err, null);
      return callback(null, result);
    });
  },
};

module.exports = ApiModel;
