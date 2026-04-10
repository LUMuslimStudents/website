
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api';

export const apiRequest = async (endpoint: string, method: string = 'GET', body?: any) => {
    const token = localStorage.getItem('token');
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`; // Corrected template literal
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'API request failed');
    }

    return response.json();
};
