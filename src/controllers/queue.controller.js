const { recibirMensajes, eliminarMensaje } = require('../services/queue.service');
const { guardarMensaje } = require('../services/table.service');

async function procesarCola(io) {
  console.log('🚀 Iniciando consumidor de cola...');

  while (true) {
    try {
      const mensajes = await recibirMensajes();

      if (mensajes.length === 0) {
        await new Promise(res => setTimeout(res, 3000));
        continue;
      }

      for (const msg of mensajes) {
        const contenidoBase64 = msg.messageText;
        const contenidoJson = Buffer.from(contenidoBase64, 'base64').toString('utf-8');
        console.log('📩 Mensaje recibido:', contenidoJson);

        let contenido;
        try {
          contenido = JSON.parse(contenidoJson);
        } catch (parseError) {
          console.error('❌ Error al parsear el mensaje:', parseError.message);
          continue;
        }

        if (!contenido?.datos) {
          console.error('❌ El mensaje no contiene el campo "datos"');
          continue;
        }

        // Guardar mensaje en Table Storage con leido: false
        const { texto, destinatario = "", remitente, urlArchivo = "" } = contenido.datos;
        await guardarMensaje({ texto, destinatario, remitente, urlArchivo });

        // Notificar a destinatarios conectados via socket
        const listaDestinatarios = destinatario.split(',').map(d => d.trim()).filter(Boolean);
        for (const destinatario of listaDestinatarios) {
          if (destinatario !== remitente) {
            console.log(`📢 Notificando a ${destinatario} con el mensaje: "${texto}"`);
            console.log("🧪 Salas activas:", Array.from(io.sockets.adapter.rooms.keys()));
            io.to(destinatario).emit("nueva_notificacion", {
              texto,
              remitente,
              urlArchivo,
              fecha: contenido.datos.fecha,
            });
          }
        }

        // Eliminar mensaje de la cola
        await eliminarMensaje(msg.messageId, msg.popReceipt);
        console.log('✅ Mensaje eliminado de la cola');
      }
    } catch (error) {
      console.error('❌ Error en consumidor de cola:', error.message);
      await new Promise(res => setTimeout(res, 5000));
    }
  }
}

module.exports = {
  procesarCola,
};
