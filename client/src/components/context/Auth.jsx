import { createContext, useState } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({children}) => {
    const userInfo = localStorage.getItem('userInfoLms');
    const [user, setUser] = useState(() => {
        if (!userInfo) {
            return null;
        }

        try {
            return JSON.parse(userInfo);
        } catch {
            return null;
        }
    });

    const login = (user) => {
        if (typeof user === 'string') {
            try {
                setUser(JSON.parse(user));
                return;
            } catch {
                setUser(null);
                return;
            }
        }

        setUser(user);
    }

    const logout = () => {
        localStorage.removeItem('userInfoLms');
        setUser(null)
    }

    return <AuthContext.Provider value={{
        user, login, logout
    }}>
        {children}
    </AuthContext.Provider>
}
