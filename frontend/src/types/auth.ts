export interface User {
    id: number;
    username: string;
    nik: string;
    full_name: string;
    role: 'admin' | 'developer' | 'user' | 'teknisi';
    is_active: boolean;
}

export interface LoginResponse {
    access_token: string;
    token_type: string;
}

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}
