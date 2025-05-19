const app = require('./app');
const http = require('http');
const { Server } = require('socket.io');
const { procesarCola } = require('./controllers/queue.controller');

const PORT = process.env.PORT || 5000;

// 🔌 Crea servidor HTTP y conecta Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // o especifica el frontend: "http://localhost:3000"
    methods: ["GET", "POST"]
  }
});

// Configura socket
io.on('connection', (socket) => {
  console.log("🔌 Nuevo cliente conectado:", socket.id);

  socket.on('join', (correo) => {
    socket.join(correo);
    
    console.log(`📥 Usuario con correo ${correo} se unió a su sala`);

    console.log("🧪 Salas actuales del socket:", socket.rooms);
  });
});


// 📨 Inicia consumidor de cola y pasa io para emitir notificaciones
procesarCola(io).catch(err => {
  console.error('Error iniciando consumidor de cola:', err.message);
});

// 🚀 Escucha
server.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`);
});
