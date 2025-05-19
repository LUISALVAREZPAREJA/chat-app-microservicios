const { queueClient } = require('../azure/azureClient');

async function enviarNotificacion(mensaje) {
  const contenido = JSON.stringify({
    tipo: "nuevo_mensaje",
    datos: {
      texto: mensaje.texto,
      destinatario: mensaje.destinatario,
      remitente: mensaje.remitente,
      urlArchivo: mensaje.urlArchivo,
      fecha: mensaje.fecha
    }
  });

  await queueClient.sendMessage(Buffer.from(contenido).toString('base64'));
  console.log("📩 Notificación enviada a la cola.");
}

async function recibirMensajes() {
  const response = await queueClient.receiveMessages();
  return response.receivedMessageItems;
}

async function eliminarMensaje(messageId, popReceipt) {
  await queueClient.deleteMessage(messageId, popReceipt);
  console.log(`🗑️ Mensaje ${messageId} eliminado de la cola.`);
}

// ✅ Exporta todas las funciones correctamente
module.exports = {
  enviarNotificacion,
  recibirMensajes,
  eliminarMensaje
};
