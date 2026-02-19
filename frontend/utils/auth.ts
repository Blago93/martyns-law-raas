import Router from 'next/router';

export const login = (token: string, user: any) => {
    localStorage.setItem('raas_token', token);
    localStorage.setItem('raas_user', user.email);
    localStorage.setItem('raas_user_id', user.id);
    Router.push('/dashboard');
};

export const logout = () => {
    localStorage.removeItem('raas_token');
    localStorage.removeItem('raas_user');
    localStorage.removeItem('raas_user_id');
    Router.push('/login');
};

export const getToken = () => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('raas_token');
    }
    return null;
};

export const isAuthenticated = () => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('raas_token');
        return !!token;
    }
    return false;
};

// API Helper to attach token
export const authHeader = () => {
    const token = getToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const getUser = () => {
    if (typeof window !== 'undefined') {
        const userStr = localStorage.getItem('raas_user');
        return userStr ? { email: userStr } : null;
    }
    return null;
};
