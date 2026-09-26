import { useEffect, useRef, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { Toast, Modal } from "bootstrap"
import { useAuth } from "../auth/useAuth"
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";



type UserProfile = {
  _id: string
  fullname: string
  username: string
  email: string
  isActive: boolean
  avatar: string
  createdAt: string
  updatedAt: string
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}


function Profile() {
  const location = useLocation()
  const navigate = useNavigate()
  const { id } = useParams()
  // Debug : Ajoute ceci pour voir si l'ID est bien capturé
  console.log("ID capturé par l'URL :", id);
  const { user, token } = useAuth()

  const isPublicProfile = !!id
  const isMyProfile = !isPublicProfile

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")

  // Toast refs
  const regToastRef = useRef<HTMLDivElement>(null)
  const loginToastRef = useRef<HTMLDivElement>(null)

  const updateToastRef = useRef<HTMLDivElement>(null)


  // Modal refs
  const editNameModalRef = useRef<HTMLDivElement>(null)
  const editAvatarModalRef = useRef<HTMLDivElement>(null)

  // Form modals
  const [editFullname, setEditFullname] = useState("")
  //const [editAvatar, setEditAvatar] = useState("")

  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null)

  /* =========================
     TOASTS REGISTER / LOGIN
  ========================== */
  useEffect(() => {

    const state = location.state as
      | { registered?: boolean; loginSuccess?: boolean }
      | null

    if (!state) return

    let triggered = false

    if (state.registered && regToastRef.current) {
      new Toast(regToastRef.current).show()
      triggered = true
    }

    if (state.loginSuccess && loginToastRef.current) {
      new Toast(loginToastRef.current).show()
      triggered = true
    }

    if (triggered) {
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.pathname, location.state, navigate])

  /* =========================
     LOAD PROFILE (NESTJS)
  ========================== */
  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true)
      setLoadError("")

      try {
        const url = isPublicProfile
          ? `${API_URL}/users/${id}` // ✅ Dynamized
          : `${API_URL}/users/me`    // ✅ Dynamized


        const headers: Record<string, string> = {}

        // Seulement pour /users/me
        if (!isPublicProfile) {
          const jwt = localStorage.getItem("token")
          if (jwt) headers.Authorization = `Bearer ${jwt}`
        }

        const res = await fetch(url, {
          headers,
        })

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.message || "Impossible de charger le profil")
        }

        setProfile(data)
      } catch (err: unknown) { // On utilise 'unknown' au lieu de 'any'
        if (err instanceof Error) {
          setLoadError(err.message)
        } else {
          setLoadError("Une erreur inconnue est survenue")
        }
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [id, isPublicProfile])

  /* =========================
     OPEN MODALS
  ========================== */
  const openEditNameModal = () => {
    if (!profile) return
    setEditFullname(profile.fullname)

    if (editNameModalRef.current) {
      new Modal(editNameModalRef.current).show()
    }
  }

  const openEditAvatarModal = () => {
    if (!profile) return
    //setEditAvatar(profile.avatar)

    if (editAvatarModalRef.current) {
      new Modal(editAvatarModalRef.current).show()
    }
  }


  const showUpdateToast = (msg: string) => {
    if (!updateToastRef.current) return
    updateToastRef.current.querySelector(".toast-body")!.textContent = msg
    new Toast(updateToastRef.current).show()
  }



  /* =========================
     SAVE (TEMP)
  ========================== */
  const saveFullname = async () => {
    if (!profile) return

    try {
      const jwt = localStorage.getItem("token")

      const res = await fetch(`${API_URL}/users/me`, { // ✅ Dynamized
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({
          fullname: editFullname.trim(),
        }),
      })


      const data = await res.json()

      if (!res.ok) throw new Error(data.message || "Erreur update")

      // 🔥 met à jour l’UI directement
      setProfile(data)

      showUpdateToast("Nom complet mis à jour avec succès ✅")
    } catch {
      showUpdateToast("Erreur lors de la mise à jour ❌")
    }
  }


  const saveAvatar = async () => {
    if (!selectedAvatarFile) return

    try {
      const jwt = localStorage.getItem("token")

      const form = new FormData()
      form.append("avatar", selectedAvatarFile)

      const res = await fetch(`${API_URL}/users/me/avatar`, { // ✅ Dynamized
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
        body: form,
      })


      const data = await res.json()

      if (!res.ok) throw new Error(data.message || "Erreur upload")

      setProfile(data)

      // reset
      setSelectedAvatarFile(null)

      showUpdateToast("Avatar mis à jour avec succès ✅")
    } catch {
      showUpdateToast("Erreur upload avatar ❌")
    }
  }


  /* =========================
     LOADING / ERROR
  ========================== */
  if (loading) {
    return <div className="text-center py-5">Chargement du profil...</div>
  }

  if (loadError || !profile) {
    return (
      <div className="container py-4">
        <div className="alert alert-danger mb-0">
          Impossible de charger le profil : {loadError}
        </div>
      </div>
    )
  }

  return (
    <>
      {/* ================= TOASTS ================= */}
      <div
        className="toast-container position-fixed top-0 end-0 p-3"
        style={{ zIndex: 1080 }}
      >
        <div
          ref={regToastRef}
          id="registerToast"
          className="toast text-bg-success"
          role="alert"
        >
          <div className="toast-body">
            Inscription réussie. Bienvenue sur votre profil.
          </div>
        </div>

        <div
          ref={loginToastRef}
          id="loginToast"
          className="toast text-bg-success"
          role="alert"
        >
          <div className="toast-body">Connexion réussie.</div>
        </div>

        <div
          ref={updateToastRef}
          className="toast text-bg-success"
          role="alert"
        >
          <div className="toast-body">Profil mis à jour</div>
        </div>

      </div>

      {/* ================= HEADER ================= */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h2 className="mb-1">
            {isMyProfile ? "Mon Profil" : `Profil de ${profile.fullname}`}
          </h2>

          {isMyProfile && (
            <div className="text-muted">
              Connecté en tant que <strong>@{user?.username}</strong>
            </div>
          )}
        </div>

        <div className="d-flex gap-2">
          <span className="badge text-bg-light border">ID : {profile._id}</span>

          {profile.isActive ? (
            <span className="badge text-bg-success">Compte actif</span>
          ) : (
            <span className="badge text-bg-danger">Compte désactivé</span>
          )}
        </div>
      </div>

      {/* ================= PROFILE CARD ================= */}
      <div className="row g-4">
        {/* LEFT CARD */}
        <div className="col-lg-4">
          <div className="card shadow-sm">
            <div className="card-body text-center">
              {/* Avatar */}
              <div className="position-relative d-inline-block">
                <img
                  src={`${API_URL}/uploads/avatars/${profile.avatar}?t=${profile.updatedAt}`} // ✅ Dynamized
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/img/default.jpg";
                  }}
                  alt="Avatar"
                  className="rounded-circle border shadow-sm"
                  style={{
                    width: 160,
                    height: 160,
                    objectFit: "cover",
                  }}
                />


                {/* Pencil avatar */}
                {isMyProfile && (
                  <button
                    type="button"
                    className="btn btn-light border position-absolute"
                    style={{
                      right: 0,
                      bottom: 0,
                      borderRadius: "50%",
                      width: 40,
                      height: 40,
                    }}
                    title="Modifier l'avatar"
                    onClick={openEditAvatarModal}
                  >
                    <i className="fa fa-pencil"></i>
                  </button>
                )}
              </div>

              {/* Fullname */}
              <div className="mt-3 d-flex align-items-center justify-content-center gap-2">
                <h4 className="mb-0">{profile.fullname}</h4>

                {isMyProfile && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    title="Modifier le nom"
                    onClick={openEditNameModal}
                  >
                    <i className="fa fa-pencil"></i>
                  </button>
                )}
              </div>

              {/* Username */}
              <div className="text-muted mt-1">@{profile.username}</div>

              {/* Email */}
              <div className="mt-3">
                <div className="small text-muted">Email</div>
                <div className="fw-semibold">{profile.email}</div>
              </div>

              <hr />

              {/* Meta */}
              <div className="text-start small">
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Créé le</span>
                  <span className="fw-semibold">
                    {formatDate(profile.createdAt)}
                  </span>
                </div>

                <div className="d-flex justify-content-between">
                  <span className="text-muted">Mis à jour</span>
                  <span className="fw-semibold">
                    {formatDate(profile.updatedAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="col-lg-8">
          <div className="row g-4">
            {/* Infos compte */}
            <div className="col-12">
              <div className="card shadow-sm">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="mb-0">
                      <i className="fa fa-user me-2 text-primary"></i>
                      Informations du compte
                    </h5>

                    {isMyProfile && (
                      <span className="badge text-bg-light border">
                        JWT: {token ? "OK" : "Absent"}
                      </span>
                    )}
                  </div>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="small text-muted">Nom complet</div>
                      <div className="fw-semibold">{profile.fullname}</div>
                    </div>

                    <div className="col-md-6">
                      <div className="small text-muted">Pseudo</div>
                      <div className="fw-semibold">{profile.username}</div>
                    </div>

                    <div className="col-md-6">
                      <div className="small text-muted">Email</div>
                      <div className="fw-semibold">{profile.email}</div>
                    </div>

                    <div className="col-md-6">
                      <div className="small text-muted">Statut</div>
                      <div className="fw-semibold">
                        {profile.isActive ? (
                          <span className="text-success">Actif</span>
                        ) : (
                          <span className="text-danger">Désactivé</span>
                        )}
                      </div>
                    </div>

                    <div className="col-md-12">
                      <div className="small text-muted">Avatar</div>
                      <div className="fw-semibold">{profile.avatar}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sécurité */}
            {isMyProfile && (
              <div className="col-12">
                <div className="card shadow-sm">
                  <div className="card-body">
                    <h5 className="mb-3">
                      <i className="fa fa-lock me-2 text-success"></i>
                      Sécurité
                    </h5>

                    <div className="alert alert-info mb-0">
                      <strong>Mot de passe :</strong> protégé (bcrypt). <br />
                      Il n’est jamais affiché côté client.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            {isMyProfile && (
              <div className="col-12">
                <div className="card shadow-sm">
                  <div className="card-body">
                    <h5 className="mb-3">
                      <i className="fa fa-bolt me-2 text-warning"></i>
                      Actions rapides
                    </h5>

                    <div className="d-flex flex-wrap gap-2">
                      <button
                        className="btn btn-outline-secondary"
                        onClick={() => window.location.reload()}
                      >
                        <i className="fa fa-refresh me-2"></i>
                        Actualiser
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================= MODAL FULLNAME ================= */}
      {isMyProfile && (
        <div
          ref={editNameModalRef}
          className="modal fade"
          tabIndex={-1}
          aria-hidden="true"
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fa fa-pencil me-2"></i>
                  Modifier le nom complet
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  data-bs-dismiss="modal"
                ></button>
              </div>

              <div className="modal-body">
                <label className="form-label">Nom complet</label>
                <input
                  className="form-control"
                  value={editFullname}
                  onChange={(e) => setEditFullname(e.target.value)}
                  placeholder="Ex: Jean Dupont"
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-light border"
                  data-bs-dismiss="modal"
                >
                  Annuler
                </button>

                <button
                  type="button"
                  className="btn btn-primary"
                  data-bs-dismiss="modal"
                  disabled={!editFullname.trim()}
                  onClick={saveFullname}
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL AVATAR ================= */}
      {isMyProfile && (
        <div
          ref={editAvatarModalRef}
          className="modal fade"
          tabIndex={-1}
          aria-hidden="true"
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fa fa-image me-2"></i>
                  Modifier l’avatar
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  data-bs-dismiss="modal"
                ></button>
              </div>

              <div className="modal-body text-center">
                <label className="form-label d-block text-start">Choisir un avatar</label>

                <input
                  type="file"
                  className="form-control mb-3"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) {
                      setSelectedAvatarFile(f)
                    }
                  }}
                />

                {/* Section Aperçu */}
                {selectedAvatarFile && (
                  <div className="mt-3">
                    <p className="small text-muted mb-2">Aperçu avant envoi :</p>
                    <img
                      // On crée une URL temporaire à partir du fichier sélectionné
                      src={URL.createObjectURL(selectedAvatarFile)}
                      alt="Aperçu"
                      className="rounded-circle border shadow-sm"
                      style={{
                        width: 120,
                        height: 120,
                        objectFit: "cover",
                      }}
                      // Nettoyage de la mémoire pour éviter les fuites
                      onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
                    />
                    <div className="mt-2 small text-primary">
                      {selectedAvatarFile.name} ({(selectedAvatarFile.size / 1024).toFixed(1)} KB)
                    </div>
                  </div>
                )}
              </div>


              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-light border"
                  data-bs-dismiss="modal"
                >
                  Annuler
                </button>

                <button
                  type="button"
                  className="btn btn-primary"
                  data-bs-dismiss="modal"
                  disabled={!selectedAvatarFile}
                  onClick={saveAvatar}
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Profile
