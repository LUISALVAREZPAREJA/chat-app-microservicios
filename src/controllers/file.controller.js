const { uploadFileToBlob } = require('../services/blob.service');

const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No se envió ningún archivo' });
    }

    const result = await uploadFileToBlob(req.file);
    res.status(200).json({
      message: 'Archivo subido exitosamente',
      file: result
    });
  } catch (err) {
    console.error('Error al subir el archivo:', err.message);
    res.status(500).json({ message: 'Error interno al subir el archivo' });
  }
};

module.exports = { uploadFile };
