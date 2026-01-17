"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { User, LoginResponse } from '../types/auth';
import { API_BASE_URL } from '@/lib/constants';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (token: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    login: async () => { },
    logout: () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    const fetchUser = async (token: string) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/users/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                const userData = await res.json();
                setUser(userData);
            } else {
                logout();
            }
        } catch (error) {
            console.error("Error fetching user:", error);
            logout();
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetchUser(token);
        } else {
            setIsLoading(false);
            if (pathname !== '/login') {
                router.push('/login');
            }
        }
    }, []);

    const login = async (token: string) => {
        setIsLoading(true);
        localStorage.setItem('token', token);
        await fetchUser(token);
        router.push('/');
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated: !!user,
            isLoading,
            login,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
};
