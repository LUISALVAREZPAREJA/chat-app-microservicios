const express = require('express');
const router = express.Router();
const { registrarUsuario, iniciarSesion } = require('../services/user.service');
const { obtenerUsuarios } = require('../controllers/user.controller');

// Registro
router.post('/register', async (req, res) => {
  const { nombre, correo, contraseña } = req.body;

  if (!nombre || !correo || !contraseña) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  try {
    const usuario = await registrarUsuario({ nombre, correo, contraseña });
    res.status(201).json(usuario);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { correo, contraseña } = req.body;

  if (!correo || !contraseña) {
    return res.status(400).json({ error: 'Correo y contraseña son obligatorios' });
  }

  try {
    const usuario = await iniciarSesion({ correo, contraseña });
    res.json(usuario);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

// En tu router de usuarios (user.routes.js o similar)
router.get("/usuarios", obtenerUsuarios);



module.exports = router;
