const { guardarMensaje } = require("../services/table.service");
const { enviarNotificacion } = require('../services/queue.service');
const { listarMensajesPorDestinatario, listarMensajesEntreUsuarios, listarMensajesNoLeidos, marcarMensajesComoLeidos } = require("../services/table.service");

async function crearMensaje(req, res) {
  try {
    const { texto, destinatarios, remitente, urlArchivo } = req.body;

    if (!texto && !urlArchivo) {
      return res.status(400).json({ error: "Debe enviar texto o archivo" });
    }

    const mensajes = await guardarMensaje({ texto, destinatarios, remitente, urlArchivo });

    // Enviar a la cola uno por uno
    for (const mensaje of mensajes) {
      console.log("📤 Enviando a la cola el mensaje:", mensaje);
      await enviarNotificacion(mensaje);
    }

    res.status(201).json({
      mensaje: "Mensaje(s) guardado(s) correctamente",
      data: mensajes,
    });
  } catch (error) {
    console.error("❌ Error en crearMensaje:", error);
    res.status(500).json({ error: "Error al guardar mensaje" });
  }
}


async function obtenerMensajesPorDestinatario(req, res) {
  try {
    const destinatario = req.params.destinatario;
    const mensajes = await listarMensajesPorDestinatario(destinatario);

    res.status(200).json({ mensajes });
  } catch (error) {
    console.error("❌ Error al listar mensajes:", error.message);
    res.status(500).json({ error: "Error al obtener mensajes" });
  }
}

async function obtenerMensajesEntreUsuarios(req, res) {
  console.log("Recibida petición para mensajes entre:", req.query);
  try {
    const { correo1, correo2 } = req.query;
    if (!correo1 || !correo2) {
      return res.status(400).json({ error: "Faltan parámetros" });
    }

    const mensajes = await listarMensajesEntreUsuarios(correo1, correo2); // debes tener este service
    res.status(200).json({ mensajes });
  } catch (error) {
    console.error("❌ Error al obtener mensajes entre usuarios:", error.message);
    res.status(500).json({ error: "Error al obtener mensajes" });
  }
}

async function obtenerMensajesNoLeidos(req, res) {
  const { correo } = req.params;
  try {
    const mensajes = await listarMensajesNoLeidos(correo);
    res.json({ mensajes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function marcarComoLeidos(req, res) {
  const { destinatario, remitente } = req.body;

  if (!destinatario || !remitente) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }

  try {
    await marcarMensajesComoLeidos(destinatario, remitente);
    res.json({ message: 'Mensajes marcados como leídos' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  crearMensaje,
  obtenerMensajesPorDestinatario,
   obtenerMensajesEntreUsuarios,
    obtenerMensajesNoLeidos,
  marcarComoLeidos,
};
