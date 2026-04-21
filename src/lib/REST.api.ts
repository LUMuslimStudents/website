
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api';

/**
 * Normalize escaped markdown sequences in strings.
 * Converts both single-escaped (\n) and double-escaped (\\n) sequences to actual characters.
 */
const normalizeMarkdownEscapes = (text: string | null | undefined): string | null | undefined => {
    if (typeof text !== 'string') {
        return text;
    }
    return text
        .replace(/\\\\r\\\\n/g, '\n')
        .replace(/\\\\n/g, '\n')
        .replace(/\\\\t/g, '\t')
        .replace(/\\r\\n/g, '\n')
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t');
};

/**
 * Recursively normalize markdown fields in events and related objects.
 */
const normalizeEventData = (data: any): any => {
    if (!data) {
        return data;
    }

    if (Array.isArray(data)) {
        return data.map(normalizeEventData);
    }

    if (typeof data === 'object') {
        const normalized: any = {};
        for (const [key, value] of Object.entries(data)) {
            if (key === 'description' && typeof value === 'string') {
                normalized[key] = normalizeMarkdownEscapes(value);
            } else if (typeof value === 'object') {
                normalized[key] = normalizeEventData(value);
            } else {
                normalized[key] = value;
            }
        }
        return normalized;
    }

    return data;
};

export const getRestData = async (endpoint: string, method: string = 'GET', body?: any) => {
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

    const data = await response.json();
    return normalizeEventData(data);
};
