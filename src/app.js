const express = require('express');
const cors = require('cors');
const fileRoutes = require('./routes/file.routes');

const app = express();

app.use(cors());
app.use(express.json());

// ✅ Aquí fileRoutes debe ser una función válida (router)
app.use('/api/files', fileRoutes);

module.exports = app;
