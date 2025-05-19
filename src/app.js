const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/user.routes');
const fileRoutes = require('./routes/file.routes');
const messageRoutes = require('./routes/message.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', userRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/mensajes', messageRoutes);

module.exports = app;
