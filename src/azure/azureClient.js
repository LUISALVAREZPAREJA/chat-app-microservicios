require('dotenv').config();
const { BlobServiceClient } = require('@azure/storage-blob');
const { TableClient, AzureNamedKeyCredential } = require('@azure/data-tables');
const { QueueClient } = require('@azure/storage-queue');

const account = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const key = process.env.AZURE_STORAGE_ACCOUNT_KEY;

// 1. Conexión para blobs (funciona con cadena de conexión)
const blobConnectionString = `DefaultEndpointsProtocol=https;AccountName=${account};AccountKey=${key};EndpointSuffix=core.windows.net`;
const blobServiceClient = BlobServiceClient.fromConnectionString(blobConnectionString);
const containerClient = blobServiceClient.getContainerClient('archivos');

// 2. Conexión para tablas (requiere URL + credencial)
const tableName = 'mensajes';
const tableUrl = `https://${account}.table.core.windows.net`;
const credential = new AzureNamedKeyCredential(account, key);
const tableClient = new TableClient(`${tableUrl}`, tableName, credential);

// 3. Conexión para colas (puedes usar también string aquí)
const queueClient = new QueueClient(blobConnectionString, 'notificaciones');

module.exports = {
  containerClient,
  tableClient,
  queueClient
};
