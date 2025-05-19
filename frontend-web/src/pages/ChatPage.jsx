import { useAuth } from "../Context/AuthContext.jsx";
import ChatApp from "../components/ChatApp";
import { useEffect } from "react";

export default function ChatPage({ onMarcarLeidas }) {
  const { user } = useAuth();

  useEffect(() => {
    // Al montar el componente, marcamos notificaciones como leídas
    if (typeof onMarcarLeidas === "function") {
      onMarcarLeidas();
    }
  }, [onMarcarLeidas]);

  if (!user) return <p>No tienes acceso. Inicia sesión.</p>;

  return <ChatApp />;
}
