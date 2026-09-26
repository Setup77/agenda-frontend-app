import { useState } from 'react'
// On sépare l'import de la constante (AuthContext) 
// de l'import des types (AuthContextType, User)
import { AuthContext } from './auth.context';
import type { AuthContextType, User } from './auth.context';

function parseToken(token: string): User | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      userId: payload.sub,
      username: payload.username,
    };
  } catch (e) {
    console.error("Token invalide", e);
    return null;
  }
}


export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(() => {
    const t = localStorage.getItem('token');
    return t ? parseToken(t) : null;
  });

  const login = (jwt: string) => {
    localStorage.setItem('token', jwt);
    setToken(jwt);
    setUser(parseToken(jwt));
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const value: AuthContextType = { user, token, login, logout }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
