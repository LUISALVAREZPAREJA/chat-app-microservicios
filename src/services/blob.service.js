const { containerClient } = require('../azure/azureClient');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const uploadFileToBlob = async (file) => {
  const blobName = `${uuidv4()}-${file.originalname}`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  await blockBlobClient.uploadData(file.buffer, {
    blobHTTPHeaders: { blobContentType: file.mimetype },
  });

  return {
    url: blockBlobClient.url,
    name: blobName,
    type: file.mimetype
  };
};

module.exports = { uploadFileToBlob };
