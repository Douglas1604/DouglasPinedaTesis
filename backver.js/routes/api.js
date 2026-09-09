const express = require("express");
const passport = require("passport");
const router = express.Router();
const UsuariosController = require("../controllers/usuariosController");
const ClientesController = require("../controllers/clientesController");
const authMiddleware = require("../middleware/authMiddleware");
const authCliMiddleware = require("../middleware/authClientMiddleware");

/**
 * @swagger
 * tags:
 *   - name: Usuarios
 *     description: Operaciones relacionadas con usuarios
 *   - name: Clientes
 *     description: Operaciones relacionadas con clientes
 */

/**
 * @swagger
 * /usuarios:
 *   get:
 *     summary: Obtiene una lista de usuarios
 *     tags: [Usuarios]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: perPage
 *         schema:
 *           type: integer
 *         default: 20
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         default: 0
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   idUsuarios:
 *                     type: integer
 *                   nome:
 *                     type: string
 *                   email:
 *                     type: string
 *       404:
 *         description: Ningún usuario localizado.
 *       500:
 *         description: Error en el servidor
 */
// Rutas de usuarios
router.get(
  "/usuarios",
  passport.authenticate("jwt-usuario", { session: false }),
  UsuariosController.getUsuarios
);

/**
 * @swagger
 * /usuarios:
 *   post:
 *     summary: Crea un nuevo usuario
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *               email:
 *                 type: string
 *               senha:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuario añadido con éxito
 *       500:
 *         description: Error en el servidor
 */
router.post(
  "/usuarios",
  passport.authenticate("jwt-usuario", { session: false }),
  UsuariosController.createUsuario
);

/**
 * @swagger
 * /usuarios/{id}:
 *   put:
 *     summary: Actualiza un usuario por ID
 *     tags: [Usuarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *               email:
 *                 type: string
 *               senha:
 *                 type: string
 *     responses:
 *       200:
 *         description: Usuario editado con éxito
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error en el servidor
 */
router.put(
  "/usuarios/:id",
  passport.authenticate("jwt-usuario", { session: false }),
  UsuariosController.updateUsuario
);

/**
 * @swagger
 * /usuarios/{id}:
 *   delete:
 *     summary: Elimina un usuario por ID
 *     tags: [Usuarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Usuario eliminado con éxito
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error en el servidor
 */
router.delete(
  "/usuarios/:id",
  passport.authenticate("jwt-usuario", { session: false }),
  UsuariosController.deleteUsuario
);

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Inicia sesión como usuario
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login exitoso
 *       401:
 *         description: Credenciales incorrectas
 *       500:
 *         description: Error en el servidor
 */
router.post("/login", UsuariosController.login);

// ... (código anterior)

/**
 * @swagger
 * /me:
 *  get:
 *   summary: Obtiene los detalles del usuario autenticado
 *   tags: [Usuarios]
 *   responses:
 *     200:
 *       description: Detalles del usuario
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               idUsuarios:
 *                 type: integer
 *               nome:
 *                 type: string
 *               email:
 *                 type: string
 *     401:
 *       description: No autorizado
 *     500:
 *       description: Error en el servidor
 */
router.get("/me", authMiddleware, UsuariosController.getMe);

/**
 * @swagger
 * /clientes:
 *   get:
 *     summary: Obtiene una lista de clientes
 *     tags: [Clientes]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: perPage
 *         schema:
 *           type: integer
 *         default: 20
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         default: 0
 *     responses:
 *       200:
 *         description: Lista de clientes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   idClientes:
 *                     type: integer
 *                   nomeCliente:
 *                     type: string
 *                   email:
 *                     type: string
 *       404:
 *         description: Ningún cliente localizado.
 *       500:
 *         description: Error en el servidor
 */

/**
 * @swagger
 * /clientes/{id}:
 *   get:
 *     summary: Obtiene los detalles de un cliente por ID
 *     tags: [Clientes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Detalles del Cliente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 idClientes:
 *                   type: integer
 *                 nomeCliente:
 *                   type: string
 *                 email:
 *                   type: string
 *                 ordensServicos:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       idOs:
 *                         type: integer
 *                       descricaoProduto:
 *                         type: string
 *                       dataCadastro:
 *                         type: string
 *                         format: date-time
 *                       valorTotal:
 *                         type: number
 *                         format: float
 *       404:
 *         description: Cliente no encontrado
 *       500:
 *         description: Error en el servidor
 */
// Rutas de clientes
router.get(
  "/clientes",
  passport.authenticate("jwt-cliente", { session: false }),
  ClientesController.getClientes
);

router.get(
  "/clientes/:id",
  passport.authenticate("jwt-cliente", { session: false }),
  ClientesController.getClientes
);

/**
 * @swagger
 * /clientes:
 *   post:
 *     summary: Crea un nuevo cliente
 *     tags: [Clientes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nomeCliente:
 *                 type: string
 *               documento:
 *                 type: string
 *               senha:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       201:
 *         description: Cliente añadido con éxito
 *       500:
 *         description: Error en el servidor
 */
router.post(
  "/clientes",
  passport.authenticate("jwt-cliente", { session: false }),
  ClientesController.createCliente
);

/**
 * @swagger
 * /clientes/{id}:
 *   put:
 *     summary: Actualiza un cliente por ID
 *     tags: [Clientes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nomeCliente:
 *                 type: string
 *               documento:
 *                 type: string
 *               senha:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cliente editado con éxito
 *       404:
 *         description: Cliente no encontrado
 *       500:
 *         description: Error en el servidor
 */
router.put(
  "/clientes/:id",
  passport.authenticate("jwt-cliente", { session: false }),
  ClientesController.updateCliente
);

/**
 * @swagger
 * /clientes/{id}:
 *   delete:
 *     summary: Elimina un cliente por ID
 *     tags: [Clientes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Cliente eliminado con éxito
 *       404:
 *         description: Cliente no encontrado
 *       500:
 *         description: Error en el servidor
 */
router.delete(
  "/clientes/:id",
  passport.authenticate("jwt-cliente", { session: false }),
  ClientesController.deleteCliente
);

/**
 * @swagger
 * /clientes/os/{id}:
 *   get:
 *     summary: Obtiene las órdenes de servicio de un cliente por ID
 *     tags: [Clientes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Ordenes de servicio del cliente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   idOs:
 *                     type: integer
 *                   descricaoProduto:
 *                     type: string
 *                   dataCadastro:
 *                     type: string
 *                     format: date-time
 *                   valorTotal:
 *                     type: number
 *                     format: float
 *       404:
 *         description: Cliente no encontrado
 *       500:
 *         description: Error en el servidor
 */

router.get(
  "/clientes/os/:id",
  passport.authenticate("jwt-cliente", { session: false }),
  ClientesController.getOsByIdClientes
);

/**
 * @swagger
 * /clientes/compras/{id}:
 *   get:
 *     summary: Obtiene las compras de un cliente por ID
 *     tags: [Clientes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Compras del cliente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   idCompra:
 *                     type: integer
 *                   descricaoProduto:
 *                     type: string
 *                   dataCadastro:
 *                     type: string
 *                     format: date-time
 *                   valorTotal:
 *                     type: number
 *                     format: float
 *       404:
 *         description: Cliente no encontrado
 *       500:
 *         description: Error en el servidor
 */
router.get(
  "/clientes/compras/:id",
  passport.authenticate("jwt-cliente", { session: false }),
  ClientesController.getAllComprasByClientes_id
);

/**
 * @swagger
 * /clientes/cobranzas/{id}:
 *   get:
 *     summary: Obtiene las cobranzas de un cliente por ID
 *     tags: [Clientes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Cobranzas del cliente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   idCobranca:
 *                     type: integer
 *                   descricaoProduto:
 *                     type: string
 *                   dataCadastro:
 *                     type: string
 *                     format: date-time
 *                   valorTotal:
 *                     type: number
 *                     format: float
 *       404:
 *         description: Cliente no encontrado
 *       500:
 *         description: Error en el servidor
 */

router.get(
  "/clientes/cobranzas/:id",
  passport.authenticate("jwt-cliente", { session: false }),
  ClientesController.getAllCobranzasByClientes_id
);

/**
 * @swagger
 * /clientes/login:
 *   post:
 *     summary: Inicia sesión como cliente
 *     tags: [Clientes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login exitoso
 *       401:
 *         description: Credenciales incorrectas
 *       500:
 *         description: Error en el servidor
 */
router.post("/clientes/login", ClientesController.login);

/**
 * @swagger
 * /me:
 *   get:
 *     summary: Obtiene los detalles del cliente autenticado
 *     tags: [Clientes]
 *     responses:
 *       200:
 *         description: Detalles del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 idClientes:
 *                   type: integer
 *                 nome:
 *                   type: string
 *                 email:
 *                   type: string
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error en el servidor
 */

router.get("/clientes/me", authCliMiddleware, ClientesController.getMe);

module.exports = router;
