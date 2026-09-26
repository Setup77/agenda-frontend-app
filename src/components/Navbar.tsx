import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import { useAuth } from '../auth/useAuth'
import { Dropdown } from 'bootstrap'

function Navbar() {
  const dropdownRef = useRef<HTMLAnchorElement>(null)
  const { user, logout } = useAuth() // On récupère l'utilisateur et la fonction logout du contexte
  const navigate = useNavigate()

const handleLogout = () => {
  sessionStorage.setItem("logout", "true")
  navigate("/", { replace: true })
  logout()
}



  useEffect(() => {
    if (dropdownRef.current) {
      new Dropdown(dropdownRef.current)
    }
  }, [])
 // console.log('Bootstrap dropdown:', window.bootstrap?.Dropdown);

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container">
        <Link className="navbar-brand" to="/">
          MiniSocial
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNavbar"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse show" id="mainNavbar">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <Link className="nav-link" to="/">
                Accueil
              </Link>
            </li>

            <li className="nav-item">
              <Link className="nav-link" to="/agenda">
                Agenda
              </Link>
            </li>

            <li className="nav-item">
              <Link className="nav-link" to="/members">
                Membres
              </Link>
            </li>
          </ul>

          <ul className="navbar-nav ms-auto">
            <li className="nav-item dropdown">
              <a className="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                {user ? `Salut, ${user.username}` : 'Compte'}
              </a>

              <ul className="dropdown-menu dropdown-menu-end">
                {!user ? ( // Si PAS d'utilisateur
                  <>
                    <li><Link className="dropdown-item" to="/login">Connexion</Link></li>
                    <li><Link className="dropdown-item" to="/register">Inscription</Link></li>
                  </>
                ) : ( // Si l'utilisateur est connecté
                  <>
                    <li><Link className="dropdown-item" to="/profile">Profil</Link></li>
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <button className="dropdown-item" onClick={handleLogout}>
                        Déconnexion
                      </button>
                    </li>
                  </>
                )}
              </ul>
            </li>
          </ul>


        </div>
      </div>
    </nav>
  )
}

export default Navbar
