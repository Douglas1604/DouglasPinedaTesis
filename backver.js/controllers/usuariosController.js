const ApiModel = require("../models/apiModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const keys = require("../config/keys");

const UsuariosController = {
  getUsuarios: (req, res) => {
    const { id, search, perPage = 20, page = 0 } = req.query;
    const start = page ? perPage * page : 0;

    if (id) {
      ApiModel.getRowById("usuarios", "idUsuarios", id, (err, usuario) => {
        if (err) return res.status(500).send(err);
        if (!usuario)
          return res.status(404).send({ message: "Usuario no encontrado" });
        res
          .status(200)
          .send({ message: "Detalles del usuario", result: usuario });
      });
    } else {
      const where = search
        ? `nome LIKE '%${search}%' OR email LIKE '%${search}%'`
        : "";

      ApiModel.get("usuarios", "*", where, perPage, start, (err, usuarios) => {
        if (err) return res.status(500).send(err);
        if (!usuarios || usuarios.length === 0)
          return res
            .status(404)
            .send({ message: "Ningún usuario localizado." });
        res
          .status(200)
          .send({ message: "Lista de usuarios", result: usuarios });
      });
    }
  },

  createUsuario: (req, res) => {
    const { nome, email, senha, ...otherData } = req.body;
    const hashedPassword = bcrypt.hashSync(senha, 10);

    const data = { nome, email, senha: hashedPassword, ...otherData };

    ApiModel.add("usuarios", data, (err, result) => {
      if (err) return res.status(500).send(err);
      ApiModel.getRowById(
        "usuarios",
        "idUsuarios",
        result.insertId,
        (err, usuario) => {
          if (err) return res.status(500).send(err);
          res
            .status(201)
            .send({ message: "Usuario añadido con éxito", result: usuario });
        }
      );
    });
  },

  updateUsuario: (req, res) => {
    const { id } = req.params;
    const { senha, ...otherData } = req.body;

    const data = { ...otherData };

    if (senha) {
      data.senha = bcrypt.hashSync(senha, 10);
    }

    ApiModel.edit("usuarios", data, "idUsuarios", id, (err, result) => {
      if (err) return res.status(500).send(err);
      if (result.affectedRows === 0)
        return res.status(404).send({ message: "Usuario no encontrado" });
      ApiModel.getRowById("usuarios", "idUsuarios", id, (err, usuario) => {
        if (err) return res.status(500).send(err);
        res
          .status(200)
          .send({ message: "Usuario editado con éxito", result: usuario });
      });
    });
  },

  deleteUsuario: (req, res) => {
    const { id } = req.params;

    ApiModel.delete("usuarios", "idUsuarios", id, (err, result) => {
      if (err) return res.status(500).send(err);
      if (result.affectedRows === 0)
        return res.status(404).send({ message: "Usuario no encontrado" });
      res.status(200).send({ message: "Usuario eliminado con éxito" });
    });
  },

  login: (req, res) => {
    const { email, password } = req.body;

    ApiModel.getUserByEmail(email, (err, user) => {
      if (err) return res.status(500).send(err);
      if (!user || !bcrypt.compareSync(password, user.senha)) {
        return res.status(401).send({ message: "Credenciales incorrectas" });
      }

      const token = jwt.sign(
        { id: user.idUsuarios, email: user.email, rol: "usuario" },
        keys.secretOrKey,
        {
          expiresIn: "1h",
        }
      );

      res.status(200).send({
        message: "Login exitoso",
        token,
        user: {
          id: user.idUsuarios,
          nome: user.nome,
          email: user.email,
          rol: "usuario",
        },
      });
    });
  },

  getMe: (req, res) => {
    const userId = req.user.id; // Cambiado de req.user.idUsuarios a req.user.id

    ApiModel.getUserById(userId, (err, user) => {
      if (err) {
        console.error("Error al obtener usuario:", err);
        return res
          .status(500)
          .send({ message: "Error interno del servidor", error: err });
      }
      if (!user) {
        console.log("Usuario no encontrado para id:", userId);
        return res.status(404).send({ message: "Usuario no encontrado" });
      }

      res.status(200).send({
        id: user.idUsuarios,
        nome: user.nome,
        email: user.email,
        bairro: user.bairro,
        cidade: user.cidade,
        estado: user.estado,
        telefone: user.telefone,
        celular: user.celular,
        rol: "usuario",
      });
    });
  },
};

module.exports = UsuariosController;
