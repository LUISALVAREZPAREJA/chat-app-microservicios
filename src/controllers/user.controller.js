const { listarUsuarios } = require('../services/user.service');

async function obtenerUsuarios(req, res) {
  try {
    const usuarios = await listarUsuarios();
    res.status(200).json({ usuarios });
  } catch (error) {
    console.error("❌ Error al listar usuarios:", error);
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
}

module.exports = {
  obtenerUsuarios
};
