import { Navigate, useLocation } from "react-router-dom"
import type { ReactNode } from "react"
import { useAuth } from "../auth/useAuth"

// ProtectedRoute.tsx
export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const location = useLocation()

  // On vérifie si on est en train de se déconnecter
  const isLoggingOut = sessionStorage.getItem("logout") === "true";

  if (!user && !isLoggingOut) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ mustLogin: true, from: location.pathname }}
      />
    )
  }

  // Si on est en train de se déconnecter (user est null mais logout est true),
  // on rend quand même les enfants brièvement le temps que le navigate('/') du Navbar s'exécute
  return <>{children}</>
}

