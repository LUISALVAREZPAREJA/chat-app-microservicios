const { guardarMensaje } = require("../services/table.service");
const { enviarNotificacion } = require('../services/queue.service');
const { listarMensajesPorDestinatario, listarMensajesEntreUsuarios, listarMensajesNoLeidos, marcarMensajesComoLeidos } = require("../services/table.service");

const crearMensaje = async (req, res) => {
  console.log("🧾 req.body:", req.body);

  try {
    const { texto, destinatarios, remitente, urlArchivo } = req.body;

    // Aseguramos que destinatarios sea un array, si es string lo convertimos en array
    let destinatariosArray = [];

    if (Array.isArray(destinatarios)) {
      destinatariosArray = destinatarios;
    } else if (typeof destinatarios === 'string') {
      // Si te llega un string separado por comas, por ejemplo:
      destinatariosArray = destinatarios.split(',').map(d => d.trim());
    } else {
      throw new Error("El campo destinatarios es inválido o no fue enviado");
    }

    const mensajesGuardados = await guardarMensaje({
  texto,
  destinatarios: destinatariosArray,
  remitente,
  urlArchivo,
});

// Enviar notificación a cada destinatario
await Promise.all(
  mensajesGuardados.map(mensaje =>
    enviarNotificacion({
      destinatario: mensaje.destinatario,
      remitente: mensaje.remitente,
      texto: mensaje.texto,
      urlArchivo: mensaje.urlArchivo,
      fecha: mensaje.fecha,
    })
  )
);



    res.status(201).json(mensajesGuardados);
  } catch (error) {
    console.error("❌ Error en crearMensaje:", error);
    res.status(500).json({ error: error.message });
  }
};



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
