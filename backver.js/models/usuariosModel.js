db = require("../config/config");

UsuariosModel = {

  //obtener un usuario por id
  getById: (id, callback) => {
    //creo una constante query y en ella vive la consulta sql, 
    //utilizando el parametro lIMIT 1 para obligar a traer un solo
    //dato
    const query = `SELECT * FROM usuario WHERE id = ? LIMIT 1`;
    //luego con la constante db ejecuto el query, 
    //pero valido si trae datos o biene null o hay un error
    db.query(query, [id], (err, result)=>{
      if(err) return callback(erro, null);
      return callback(null, result[0]);
    });

  },

  //get generico universal 
  get: (table, columns, where, limit, offset, callback) => {

    const query = `SELECT ${columns} FROM ${table} ${
      where ? `WHERE ${where}` : ""
      } lIMIT ${limit} OFFSET ${offset}`;
      db.query(query, (err, result) =>{

        if(err) return callback(erro, null);
        return callback(null, result);
      });
  },

  //functions add users universal
  add : (table, data, callback) => {
    const query = `INSERT INTO ?? SET ?`;
    db.query(query, [table, data], (err, result) => {

      if(err) return callback(erro, null);
      return callback(null, result.insertId);
    });
  }, 

  //edit universal 
  edit: (table, data, fieldID, ID, callback) => {
    
    const query = `UPDATE ?? SET ? WHERE ?? = ?`;

    db.query(query, [table, data, fieldID,ID], (err, result) =>{

      if(err) return callback(erro, null);
      return callback(null, result);
    });
  }, 
  
  //delete universal que debe ser un update
  //si vamos a eliminar sera un update = `UPDATE usuarios SET estado_usuario = 0 WHERE id_usuario = 1 AND estado_usuario = 1`

};

module.exports = UsuariosModel;

 
