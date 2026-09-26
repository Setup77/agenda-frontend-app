import { useState, useEffect, useRef } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../auth/useAuth"
import { Toast } from "bootstrap"

// ✅ Utilisation de la variable d'environnement Vite en production, fallback sur localhost en dev
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [errors, setErrors] = useState<string[]>([])
  const [form, setForm] = useState({
    login: "",
    password: "",
    csrfToken: "",
  })

  useEffect(() => {
    // ✅ URL locale nettoyée et dynamisée
    fetch(`${API_URL}/auth/csrf-token`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        setForm((prev) => ({ ...prev, csrfToken: data.csrfToken }))
      })
  }, [])


  const location = useLocation()
  const mustLoginToastRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const state = location.state as { mustLogin?: boolean } | null

    if (state?.mustLogin && mustLoginToastRef.current) {
      new Toast(mustLoginToastRef.current).show()

      // Nettoie l'état pour éviter toast au refresh
      window.history.replaceState({}, document.title)
    }
  }, [location.state])


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors([])

    // ✅ URL locale nettoyée et dynamisée
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })

    const data = await res.json()

    if (!res.ok) {
      setErrors([data.message || "Erreur de connexion"])
      return
    }

    // ✅ IMPORTANT : met à jour le AuthContext
    login(data.access_token)

    // ✅ un seul navigate
    navigate("/profile", {
      state: { loginSuccess: true },
    })
  }

  return (
    <div className="row justify-content-center">
      <div
        className="toast-container position-fixed top-0 end-0 p-3"
        style={{ zIndex: 1080 }}
      >
        <div
          ref={mustLoginToastRef}
          className="toast text-bg-warning"
          role="alert"
        >
          <div className="toast-body">
            Connectez-vous pour accéder à l’agenda 🔒
          </div>
        </div>
      </div>

      <div className="col-md-5">
        <div className="card shadow">
          <div className="card-body">
            <h3 className="text-center mb-4">Connexion</h3>

            {errors.map((e, i) => (
              <div key={i} className="alert alert-danger">
                {e}
              </div>
            ))}

            <form onSubmit={handleSubmit}>
              <input type="hidden" value={form.csrfToken} />

              <input
                className="form-control mb-3"
                name="login"
                placeholder="Pseudo ou Email"
                onChange={handleChange}
              />

              <input
                className="form-control mb-3"
                type="password"
                name="password"
                placeholder="Mot de passe"
                onChange={handleChange}
              />

              <button className="btn btn-success w-100">
                Se connecter
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
