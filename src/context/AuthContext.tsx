import { createContext } from 'react';

export interface User {
    userId: string;
    username: string;
}

export interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string) => void;
    logout: () => void;
}

// On n'exporte que l'objet de contexte ici
export const AuthContext = createContext<AuthContextType | undefined>(undefined);
