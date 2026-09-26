import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
// ✅ Dynamic API URL configuration for production and local development
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";


type Member = {
  _id: string
  fullname: string
  username: string
  email: string
  isActive: boolean
  avatar: string
  createdAt: string
}

function Members() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")

  // ✅ pagination
  const [page, setPage] = useState(1)
  const pageSize = 6 // (3 colonnes sur lg -> joli)

  useEffect(() => {
    const loadMembers = async () => {
      setLoading(true)
      setError("")

      try {
        // ✅ Dynamized endpoint url
        const res = await fetch(`${API_URL}/users`)
        const data = await res.json()

        if (!res.ok) throw new Error(data.message || "Erreur chargement users")

        setMembers(data)
      } catch (err: unknown) {
        if (err instanceof Error) setError(err.message)
        else setError("Erreur inconnue")
      } finally {
        setLoading(false)
      }
    }

    loadMembers()
  }, [])


  // ✅ filtre recherche
  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return members

    return members.filter((m) => {
      return (
        m.username.toLowerCase().includes(q) ||
        m.fullname.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q)
      )
    })
  }, [members, search])

  // ✅ reset page si recherche change
  useEffect(() => {
    setPage(1)
  }, [search])

  // ✅ calcul pagination
  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / pageSize))

  const paginatedMembers = useMemo(() => {
    const start = (page - 1) * pageSize
    const end = start + pageSize
    return filteredMembers.slice(start, end)
  }, [filteredMembers, page, pageSize])

  // pages à afficher (ex: 1 2 3 4 5)
  const pagesToShow = useMemo(() => {
    const maxButtons = 5

    let start = Math.max(1, page - 2)
    const end = Math.min(totalPages, start + maxButtons - 1)

    // Ajuste start si on est en fin
    start = Math.max(1, end - maxButtons + 1)

    const arr: number[] = []
    for (let i = start; i <= end; i++) arr.push(i)

    return arr
  }, [page, totalPages])


  if (loading) {
    return <div className="text-center py-5">Chargement des membres...</div>
  }

  if (error) {
    return (
      <div className="container py-4">
        <div className="alert alert-danger mb-0">
          Impossible de charger les membres : {error}
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      {/* HEADER */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className="mb-1">Membres</h2>
          <div className="text-muted">
            {filteredMembers.length} utilisateur(s)
          </div>
        </div>

        {/* SEARCH */}
        <div style={{ width: 280 }}>
          <input
            className="form-control"
            placeholder="Rechercher un membre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* GRID */}
      <div className="row g-4">
        {paginatedMembers.map((m) => (
          <div key={m._id} className="col-12 col-md-6 col-lg-4">
            <div className="card shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex align-items-center gap-3">
                  {/* Avatar */}
                  <img
                    src={`${API_URL}/uploads/avatars/${m.avatar}`} // ✅ Dynamized asset path
                    alt="avatar"
                    className="rounded-circle border"
                    style={{
                      width: 64,
                      height: 64,
                      objectFit: "cover",
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/img/default.jpg"
                    }}
                  />


                  {/* Infos */}
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center justify-content-between">
                      <Link
                        to={`/profile/${m._id}`}
                        className="fw-bold text-decoration-none"
                      >
                        @{m.username}
                      </Link>

                      {m.isActive ? (
                        <span className="badge text-bg-success">Actif</span>
                      ) : (
                        <span className="badge text-bg-danger">Inactif</span>
                      )}
                    </div>

                    <div className="text-muted small">{m.fullname}</div>
                    <div className="small">{m.email}</div>
                  </div>
                </div>

                <hr />

                <div className="d-flex justify-content-between small text-muted">
                  <span>ID</span>
                  <span className="text-truncate" style={{ maxWidth: 180 }}>
                    {m._id}
                  </span>
                </div>
              </div>

              <div className="card-footer bg-white border-0 pt-0">
                <Link
                  to={`/agenda/${m._id}`}
                  className="btn btn-outline-primary w-100"
                >
                  Voir l'agenda
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* EMPTY */}
      {filteredMembers.length === 0 && (
        <div className="text-center py-5 text-muted">
          Aucun membre trouvé.
        </div>
      )}

      {/* PAGINATION */}
      {filteredMembers.length > pageSize && (
        <nav className="mt-4 d-flex justify-content-center">
          <ul className="pagination">
            {/* Prev */}
            <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
              <button
                className="page-link"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Précédent
              </button>
            </li>

            {/* First */}
            {pagesToShow[0] > 1 && (
              <>
                <li className="page-item">
                  <button className="page-link" onClick={() => setPage(1)}>
                    1
                  </button>
                </li>
                {pagesToShow[0] > 2 && (
                  <li className="page-item disabled">
                    <span className="page-link">...</span>
                  </li>
                )}
              </>
            )}

            {/* Pages */}
            {pagesToShow.map((p) => (
              <li key={p} className={`page-item ${p === page ? "active" : ""}`}>
                <button className="page-link" onClick={() => setPage(p)}>
                  {p}
                </button>
              </li>
            ))}

            {/* Last */}
            {pagesToShow[pagesToShow.length - 1] < totalPages && (
              <>
                {pagesToShow[pagesToShow.length - 1] < totalPages - 1 && (
                  <li className="page-item disabled">
                    <span className="page-link">...</span>
                  </li>
                )}
                <li className="page-item">
                  <button
                    className="page-link"
                    onClick={() => setPage(totalPages)}
                  >
                    {totalPages}
                  </button>
                </li>
              </>
            )}

            {/* Next */}
            <li className={`page-item ${page === totalPages ? "disabled" : ""}`}>
              <button
                className="page-link"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Suivant
              </button>
            </li>
          </ul>
        </nav>
      )}
    </div>
  )
}

export default Members
