const express = require("express");
const router = express.Router();
const { crearMensaje, obtenerMensajesPorDestinatario, obtenerMensajesEntreUsuarios, obtenerMensajesNoLeidos, marcarComoLeidos } = require("../controllers/message.controller");

router.post("/", crearMensaje);
router.get("/entre", obtenerMensajesEntreUsuarios);
router.get("/:destinatario", obtenerMensajesPorDestinatario);
router.get('/no-leidos/:correo', obtenerMensajesNoLeidos);
router.post('/marcar-leidos', marcarComoLeidos);
module.exports = router;
