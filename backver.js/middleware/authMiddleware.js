const jwt = require("jsonwebtoken");
const keys = require("../config/keys");

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    console.log("No se proporcionó token");
    return res.status(401).send({ message: "Token no proporcionado" });
  }

  jwt.verify(token, keys.secretOrKey, (err, decoded) => {
    if (err) {
      console.log("Error al verificar el token:", err);
      return res
        .status(401)
        .send({ message: "Token inválido", error: err.message });
    }

    console.log("Token decodificado:", decoded);
    req.user = decoded;
    next();
  });
};

module.exports = authMiddleware;
