const { tableClient } = require('../azure/azureClient');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

const partitionKey = 'usuarios';

async function registrarUsuario({ nombre, correo, contraseña }) {
  const usuarios = await tableClient.listEntities({
    queryOptions: {
      filter: `PartitionKey eq '${partitionKey}'`
    }
  });

  for await (const usuario of usuarios) {
    if (usuario.correo === correo) {
      throw new Error('El correo ya está registrado');
    }
  }

  const rowKey = uuidv4();
  const contraseñaHasheada = await bcrypt.hash(contraseña, 10);

  const entidad = {
    partitionKey,
    rowKey,
    nombre,
    correo,
    contraseña: contraseñaHasheada,
  };

  await tableClient.createEntity(entidad);
  return { nombre, correo };
}

async function listarUsuarios() {
  const usuarios = [];

  const entidades = tableClient.listEntities({
    queryOptions: {
       filter: `PartitionKey eq '${partitionKey}' and correo eq '${correo}'`
    }
  });

  for await (const entidad of entidades) {
    usuarios.push({
      nombre: entidad.nombre,  
      correo: entidad.correo,
    });
  }

  return usuarios;
}

async function iniciarSesion({ correo, contraseña }) {
  const usuarios = await tableClient.listEntities({
    queryOptions: {
      filter: `PartitionKey eq '${partitionKey}'`
    }
  });

  for await (const usuario of usuarios) {
    if (usuario.correo === correo) {
      const match = await bcrypt.compare(contraseña, usuario.contraseña);
      if (match) {
        return { nombre: usuario.nombre, correo: usuario.correo };
      } else {
        throw new Error('Contraseña incorrecta');
      }
    }
  }

  throw new Error('Correo no registrado');
}

module.exports = {
  registrarUsuario,
  iniciarSesion,
  listarUsuarios
};
