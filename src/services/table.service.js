const { tableClient } = require('../azure/azureClient');
const { v4: uuidv4 } = require('uuid');

async function guardarMensaje({ texto, destinatarios = "", remitente, urlArchivo = "" }) {
  const fecha = new Date().toISOString();
  const estado = "enviado";
  const partitionKey = "chat_general";

  const destinatariosArray = destinatarios.split(',').map(d => d.trim()).filter(d => d);

  const mensajesGuardados = [];

  for (const destinatario of destinatariosArray) {
    const rowKey = uuidv4();

    const entidad = {
      partitionKey,
      rowKey,
      fecha,
      texto,
      estado,
      destinatario,
      remitente,
      urlArchivo,
      leido:false
    };

    await tableClient.createEntity(entidad);
    console.log("✅ Entidad guardada:", entidad);
    

    mensajesGuardados.push(entidad);
  }

  return mensajesGuardados;
}

async function listarMensajesPorDestinatario(destinatario) {
  const mensajes = [];

  const iterator = tableClient.listEntities({
    queryOptions: {
      filter: `PartitionKey eq 'chat_general'`
    }
  });

  for await (const entidad of iterator) {
    if (entidad.destinatario === destinatario) {
      mensajes.push(entidad);
    }
  }

  return mensajes;
}

async function listarMensajesEntreUsuarios(correo1, correo2) {
  const mensajes = [];
  const iterator = tableClient.listEntities({
    queryOptions: {
      filter: `PartitionKey eq 'chat_general'`
    }
  });

  for await (const entidad of iterator) {
    const esEntreUsuarios =
      (entidad.remitente === correo1 && entidad.destinatario === correo2) ||
      (entidad.remitente === correo2 && entidad.destinatario === correo1);

    if (esEntreUsuarios) {
      mensajes.push(entidad);
    }
  }

  // Ordenar por fecha (ISO string, por lo que se ordena lexicográficamente)
  mensajes.sort((a, b) => a.fecha.localeCompare(b.fecha));

  return mensajes;
}

async function listarMensajesNoLeidos(destinatario) {
  const mensajes = [];

  const iterator = tableClient.listEntities({
    queryOptions: {
      filter: `PartitionKey eq 'chat_general' and leido eq false`
    }
  });

  for await (const entidad of iterator) {
    const leido = entidad.leido === true || entidad.leido === 'true'; // por si viene como string o boolean
    if (entidad.destinatario === destinatario && !leido) {
      mensajes.push({ ...entidad, leido: false });
    }
  }

  return mensajes;
}


// Función para marcar mensajes como leídos (entre remitente y destinatario)
async function marcarMensajesComoLeidos(destinatario, remitente) {
  const iterator = tableClient.listEntities({
    queryOptions: {
      filter: `PartitionKey eq 'chat_general' and leido eq false`
    }
  });

  for await (const entidad of iterator) {
    const destinatarios = entidad.destinatario?.split(',').map(d => d.trim());

    const esEntreUsuarios =
      destinatarios?.includes(destinatario) &&
      entidad.remitente === remitente;

    if (esEntreUsuarios) {
      await tableClient.updateEntity({
        partitionKey: entidad.partitionKey,
        rowKey: entidad.rowKey,
        leido: true,
      }, "Merge");
    }
  }
}





module.exports = {
  guardarMensaje,
  listarMensajesPorDestinatario,
  listarMensajesEntreUsuarios,
   listarMensajesNoLeidos,
  marcarMensajesComoLeidos,
};
