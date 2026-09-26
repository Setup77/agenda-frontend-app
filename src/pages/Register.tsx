import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";


function Register() {
  const [form, setForm] = useState({
    fullname: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    captcha: "",
    csrfToken: "",
  });

  const navigate = useNavigate();

  const [errors, setErrors] = useState<string[]>([]);
  const [captchaQuestion, setCaptchaQuestion] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setTouched((prev) => ({ ...prev, [e.target.name]: true }));
  };

  const loadCaptcha = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/captcha`, { // ✅ Dynamized
        credentials: "include",
      });


      if (!res.ok) throw new Error("Erreur serveur captcha");

      const data = await res.json();
      setCaptchaQuestion(data.question);
      setForm((f) => ({ ...f, captcha: "" }));
    } catch (err) {
      console.error("Captcha indisponible", err);
      setCaptchaQuestion("Service indisponible");
    }
  };

  useEffect(() => {
    loadCaptcha();
  }, []);

  useEffect(() => {
    const loadCsrf = async () => {
      try {
        const res = await fetch(`${API_URL}/auth/csrf-token`, { // ✅ Dynamized
          credentials: "include",
        });


        if (!res.ok) throw new Error();

        const data = await res.json();
        setForm((f) => ({ ...f, csrfToken: data.csrfToken }));
      } catch {
        console.error("CSRF indisponible");
      }
    };

    loadCsrf();
  }, []);

  /* ===================== VALIDATION ===================== */

  const isFullnameValid = form.fullname.trim().length >= 3;
  const isUsernameValid = form.username.trim().length >= 3;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
  const isPasswordValid = form.password.length >= 5;
  const isConfirmPasswordValid =
    form.confirmPassword.length >= 5 && form.password === form.confirmPassword;

  const isCaptchaLoaded =
    captchaQuestion !== "" && captchaQuestion !== "Service indisponible";

  const isCaptchaValid =
    isCaptchaLoaded && form.captcha.trim().length > 0 && /^\d+$/.test(form.captcha);

  const isCsrfReady = form.csrfToken.trim().length > 0;

  // ✅ Formulaire globalement valide
  const isFormValid =
    isFullnameValid &&
    isUsernameValid &&
    isEmailValid &&
    isPasswordValid &&
    isConfirmPasswordValid &&
    isCaptchaValid &&
    isCsrfReady;

  const validate = (): boolean => {
    const errs: string[] = [];

    if (!isFullnameValid) errs.push("Nom et prénom requis");
    if (!isUsernameValid) errs.push("Pseudo requis");
    if (!isEmailValid) errs.push("Email invalide");
    if (!isPasswordValid) errs.push("Mot de passe trop court");
    if (!isConfirmPasswordValid) errs.push("Les mots de passe ne correspondent pas");
    if (!isCaptchaValid) errs.push("Captcha requis");

    setErrors(errs);
    return errs.length === 0;
  };

  /* ===================== SUBMIT ===================== */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Marquer tous les champs comme touched
    setTouched({
      fullname: true,
      username: true,
      email: true,
      password: true,
      confirmPassword: true,
      captcha: true,
    });

    if (!validate()) return;

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/register`, { // ✅ Dynamized
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });


      const data = await response.json();

      if (!response.ok) {
        const serverErrors = Array.isArray(data.message)
          ? data.message
          : [data.message];

        setErrors(serverErrors);
        await loadCaptcha();
        setLoading(false);
        return;
      }

      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));

      navigate("/profile", {
        state: {
          registered: true,
        },
      });
    } catch {
      setErrors(["Impossible de contacter le serveur"]);
    } finally {
      setLoading(false);
    }
  };

  /* ===================== CSS HELPERS ===================== */

  const inputClass = (isValid: boolean, name: string) => {
    if (!touched[name]) return "form-control mb-3";
    return `form-control mb-3 ${isValid ? "is-valid" : "is-invalid"}`;
  };

  return (
    <div className="row justify-content-center">
      <div className="col-md-6 col-lg-5">
        <div className="card shadow">
          <div className="card-body">
            <h3 className="text-center mb-4">Inscription</h3>

            {errors.map((err, i) => (
              <div key={i} className="alert alert-danger">
                {err}
              </div>
            ))}

            <form onSubmit={handleSubmit}>
              <input type="hidden" name="csrfToken" value={form.csrfToken} />

              <input
                className={inputClass(isFullnameValid, "fullname")}
                name="fullname"
                placeholder="Nom et prénom"
                value={form.fullname}
                onChange={handleChange}
                onBlur={handleBlur}
              />

              <input
                className={inputClass(isUsernameValid, "username")}
                name="username"
                placeholder="Pseudo"
                value={form.username}
                onChange={handleChange}
                onBlur={handleBlur}
              />

              <input
                className={inputClass(isEmailValid, "email")}
                type="email"
                name="email"
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
                onBlur={handleBlur}
              />

              <input
                className={inputClass(isPasswordValid, "password")}
                type="password"
                name="password"
                placeholder="Mot de passe"
                value={form.password}
                onChange={handleChange}
                onBlur={handleBlur}
              />

              <input
                className={inputClass(isConfirmPasswordValid, "confirmPassword")}
                type="password"
                name="confirmPassword"
                placeholder="Confirmer le mot de passe"
                value={form.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
              />

              <div className="input-group mb-3">
                <input
                  className={
                    touched["captcha"]
                      ? `form-control ${isCaptchaValid ? "is-valid" : "is-invalid"
                      }`
                      : "form-control"
                  }
                  name="captcha"
                  value={form.captcha}
                  placeholder={
                    captchaQuestion
                      ? `Calcul : ${captchaQuestion}`
                      : "Chargement du captcha..."
                  }
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={!isCaptchaLoaded}
                />

                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={loadCaptcha}
                  disabled={loading}
                >
                  ↻
                </button>
              </div>

              <button
                className="btn btn-primary w-100"
                disabled={!isFormValid || loading}
              >
                {loading ? "Création..." : "Créer le compte"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
