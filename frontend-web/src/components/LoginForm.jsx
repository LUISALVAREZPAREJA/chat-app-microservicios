import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";

export default function LoginForm() {
  const [correo, setCorreo] = useState("");
  const [contraseña, setPassword] = useState("");
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo, contraseña }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Credenciales inválidas");
      }

      const user = await res.json();
      login(user);
      navigate("/chat");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
   <form onSubmit={handleSubmit} style={{ maxWidth: "400px", margin: "2rem auto", padding: "2rem", border: "1px solid #ddd", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
  <h3 style={{ textAlign: "center", marginBottom: "1.5rem" }}>Iniciar sesión</h3>
  
  {error && <p style={{ color: "red", marginBottom: "1rem", textAlign: "center" }}>{error}</p>}
  
  <input
    type="email"
    placeholder="Correo electrónico"
    value={correo}
    onChange={(e) => setCorreo(e.target.value)}
    required
    style={{ width: "100%", padding: "10px", marginBottom: "1rem", borderRadius: "4px", border: "1px solid #ccc", fontSize: "1rem" }}
  />
  
  <input
    type="password"
    placeholder="Contraseña"
    value={contraseña}
    onChange={(e) => setPassword(e.target.value)}
    required
    style={{ width: "100%", padding: "10px", marginBottom: "1rem", borderRadius: "4px", border: "1px solid #ccc", fontSize: "1rem" }}
  />
  
  <button
    type="submit"
    style={{
      width: "100%",
      padding: "10px",
      backgroundColor: "#007bff",
      color: "white",
      border: "none",
      borderRadius: "4px",
      fontSize: "1.1rem",
      cursor: "pointer",
      marginBottom: "1rem"
    }}
  >
    Iniciar sesión
  </button>
  
  <p style={{ textAlign: "center", fontSize: "0.9rem" }}>
    ¿No tienes cuenta?{" "}
    <button
      type="button"
      onClick={() => navigate("/register")}
      style={{ color: "#007bff", textDecoration: "underline", background: "none", border: "none", padding: 0, cursor: "pointer", fontWeight: "bold" }}
    >
      Regístrate aquí
    </button>
  </p>
</form>

    
  );
}
