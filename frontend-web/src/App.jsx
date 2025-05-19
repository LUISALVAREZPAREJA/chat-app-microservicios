import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './Context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ChatPage from './pages/ChatPage';
import React, { useEffect, useState } from "react";
import { socket } from "./socket";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function AppContent() {
  const { user } = useAuth();
  const [notificacionesNoLeidas, setNotificacionesNoLeidas] = useState(0);

  useEffect(() => {
  if (!user?.correo) return;

  const onConnect = () => {
    console.log("🟢 Socket conectado con id:", socket.id);
    socket.emit("join", user.correo);
  };

  const handleNotificacion = (data) => {
    console.log("📥 Notificación recibida:", data);
    toast.info(`🔔 Nuevo mensaje de ${data.remitente}: ${data.texto}`);
    setNotificacionesNoLeidas((prev) => prev + 1);
  };

  socket.connect(); // Solo se llama una vez si autoConnect: false
  socket.on("connect", onConnect);
  socket.on("nueva_notificacion", handleNotificacion);

  return () => {
    socket.off("connect", onConnect);
    socket.off("nueva_notificacion", handleNotificacion);
  };
}, [user]);



  return (
    <>
      {/* Toast Container para mostrar las notificaciones */}
      <ToastContainer 
        position="top-right" 
        autoClose={5000} 
        hideProgressBar={false} 
        newestOnTop={false} 
        closeOnClick 
        rtl={false} 
        pauseOnFocusLoss 
        draggable 
        pauseOnHover 
        theme="light" 
      />

      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/chat"
          element={<ChatPage onMarcarLeidas={() => setNotificacionesNoLeidas(0)} />}
        />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}
