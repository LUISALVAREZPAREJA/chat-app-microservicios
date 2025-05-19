import React, { useState, useEffect } from "react";
import { useAuth } from "../Context/AuthContext"; // Asegúrate de tener este contexto creado

function ChatApp() {
  const { user } = useAuth(); // user = { nombre, correo }
  const [destinatarios, setDestinatarios] = useState([]);
  const [destinatarioSeleccionado, setDestinatarioSeleccionado] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [mensajes, setMensajes] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [archivo, setArchivo] = useState(null);
  const [noLeidos, setNoLeidos] = useState({});



 useEffect(() => {
    async function cargarUsuarios() {
      try {
        const res = await fetch("http://localhost:5000/api/usuarios"); // Cambia por la URL correcta
        const data = await res.json();

        // Excluir el usuario actual de la lista
        const usuariosFiltrados = data.usuarios.filter(u => u.correo !== user.correo);
        setDestinatarios(usuariosFiltrados);
        console.log("Usuarios filtrados:", usuariosFiltrados);


        // Seleccionar el primero de la lista
        if (usuariosFiltrados.length > 0) {
          setDestinatarioSeleccionado(usuariosFiltrados[0].correo);
        }
      } catch (error) {
        console.error("Error al cargar usuarios:", error);
      }
    }

    if (user) cargarUsuarios();
  }, [user]);


 useEffect(() => {
  if (user && destinatarioSeleccionado) {
    const obtenerMensajes = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/mensajes/entre?correo1=${user.correo}&correo2=${destinatarioSeleccionado}`);
        const data = await response.json();
        setMensajes(data.mensajes || []);

        // Marcar como leídos si hay mensajes pendientes
        await fetch("http://localhost:5000/api/mensajes/marcar-leidos", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            destinatario: user.correo,
            remitente: destinatarioSeleccionado,
          }),
        });

        // Actualiza la lista de no leídos
        setNoLeidos(prev => {
          const actualizado = { ...prev };
          delete actualizado[destinatarioSeleccionado];
          return actualizado;
        });

      } catch (error) {
        console.error("❌ Error al cargar o marcar mensajes:", error);
      }
    };

    obtenerMensajes();
  }
}, [user, destinatarioSeleccionado]);




 const enviarMensaje = async () => {
  if ((!mensaje.trim() && !archivo) || destinatarioSeleccionado === user.correo) return;

  let urlArchivo = "";

  // Subir archivo si existe
  if (archivo) {
    try {
      const formData = new FormData();
      formData.append("file", archivo);

      const uploadRes = await fetch("http://localhost:5000/api/files/upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();
      urlArchivo = uploadData.url || "";
    } catch (error) {
      console.error("❌ Error al subir archivo:", error);
      return;
    }
  }

  // Luego enviamos el mensaje
  try {
    const response = await fetch("http://localhost:5000/api/mensajes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        texto: mensaje,
        destinatarios: destinatarioSeleccionado,
        remitente: user.correo,
        urlArchivo,
      }),
    });

    const data = await response.json();
    if (data.data) {
      setMensajes(prev => [...prev, ...data.data]);
    }

    setMensaje("");
    setArchivo(null);
  } catch (error) {
    console.error("❌ Error al enviar mensaje:", error);
  }
};

  useEffect(() => {
  const obtenerNoLeidos = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/mensajes/no-leidos/${user.correo}`);
      const data = await res.json();

      // Agrupar no leídos por remitente
      const agrupados = {};
      const mensajes = data.mensajes || [];
      console.log("📦 Respuesta no leídos:", data);

      mensajes.forEach(msg => {
        const remitente = msg.remitente;
        agrupados[remitente] = (agrupados[remitente] || 0) + 1;
      });


      setNoLeidos(agrupados);
    } catch (error) {
      console.error("❌ Error al obtener no leídos:", error);
    }
  };

  if (user) obtenerNoLeidos();
}, [user, mensajes]); // se actualiza también cuando llegan mensajes


useEffect(() => {
  const intervalo = setInterval(async () => {
    if (!user) return;

    // Actualizar mensajes si hay un chat activo
    if (destinatarioSeleccionado) {
      try {
        const res = await fetch(`http://localhost:5000/api/mensajes/entre?correo1=${user.correo}&correo2=${destinatarioSeleccionado}`);
        const data = await res.json();
        setMensajes(data.mensajes || []);
      } catch (err) {
        console.error("❌ Error al refrescar mensajes:", err);
      }
    }

    // Actualizar mensajes no leídos
    try {
      const res = await fetch(`http://localhost:5000/api/mensajes/no-leidos/${user.correo}`);
      const data = await res.json();

      const agrupados = {};
      const mensajes = data.mensajes || [];
      console.log("Mensajes no leídos recibidos:", data);
      mensajes.forEach(msg => {
        const remitente = msg.remitente;
        agrupados[remitente] = (agrupados[remitente] || 0) + 1;
      });


      setNoLeidos(agrupados);
    } catch (err) {
      console.error("❌ Error al refrescar no leídos:", err);
    }
  }, 5000); // Cada 5 segundos

  return () => clearInterval(intervalo); // Limpiar al desmontar
}, [user, destinatarioSeleccionado]);



  const mensajesFiltrados = mensajes.filter(
  m =>
    (m.remitente === user.correo && m.destinatario === destinatarioSeleccionado) ||
    (m.remitente === destinatarioSeleccionado && m.destinatario === user.correo)
);


  return (
    <div className="d-flex" style={{ height: "90vh" }}>
      {/* Sidebar */}
      <div className="border-end d-flex flex-column" style={{ width: "250px" }}>
        <h5 className="p-3 border-bottom">Destinatarios</h5>

        {/* Buscador */}
        <div className="px-3 mb-2">
          <input
            type="text"
            className="form-control"
            placeholder="Buscar..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        {/* Lista de users */}
       <ul className="list-group list-group-flush overflow-auto" style={{ flexGrow: 1 }}>
  {destinatarios
  
    .filter(d =>
      (d.nombre || "").toLowerCase().includes((busqueda || "").toLowerCase())
    )
    .map((d) => (
      <li
        key={d.correo}
        className={`list-group-item ${d.correo === destinatarioSeleccionado ? "active" : ""}`}
        style={{ cursor: "pointer" }}
        onClick={() => setDestinatarioSeleccionado(d.correo)}
      >
        <div className="d-flex justify-content-between align-items-center">
  <span>{d.nombre}</span>
  {noLeidos[d.correo] && (
    <span className="badge bg-danger">{noLeidos[d.correo]}</span>
  )}
</div>

      </li>
    ))}
</ul>

      </div>

      {/* Chat principal */}
      <div className="flex-grow-1 d-flex flex-column">
        <div className="border-bottom p-3">
          <h5>Chat con: {destinatarioSeleccionado}</h5>
        </div>

        <div className="flex-grow-1 p-3 overflow-auto" style={{ backgroundColor: "#f8f9fa" }}>
          {mensajesFiltrados.map((m, i) => (
            <div
              key={i}
              className={`mb-2 d-flex ${m.remitente === user.correo ? "justify-content-end" : "justify-content-start"}`}
            >
              <div
                className={`p-2 rounded ${m.de === user.correo ? "bg-primary text-white" : "bg-light"}`}
                style={{ maxWidth: "60%" }}
              >
                {m.texto && <div>{m.texto}</div>}
                {m.urlArchivo && (
                  <a href={m.urlArchivo} target="_blank" rel="noopener noreferrer">
                    📎 Ver archivo
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 border-top d-flex">
          <input
            type="text"
            className="form-control me-2"
            placeholder="Escribe un mensaje"
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && enviarMensaje()}
          />
          <input
            type="file"
            onChange={(e) => setArchivo(e.target.files[0])}
            className="form-control me-2"
            style={{ maxWidth: "200px" }}
          />
          <button className="btn btn-primary" onClick={enviarMensaje}>
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatApp;
