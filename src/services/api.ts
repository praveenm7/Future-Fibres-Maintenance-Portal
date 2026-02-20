const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002/api';

const REQUEST_TIMEOUT = 30000; // 30 seconds

/**
 * Generic API Client with typed request/response, timeout, and safe DELETE handling.
 */
export const api = {
    async get<T>(endpoint: string): Promise<T> {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            signal: AbortSignal.timeout(REQUEST_TIMEOUT),
        });
        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }
        return response.json();
    },

    async post<T, D = unknown>(endpoint: string, data: D): Promise<T> {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
            signal: AbortSignal.timeout(REQUEST_TIMEOUT),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || `API Error: ${response.statusText}`);
        }
        return response.json();
    },

    async put<T, D = unknown>(endpoint: string, data: D): Promise<T> {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
            signal: AbortSignal.timeout(REQUEST_TIMEOUT),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || `API Error: ${response.statusText}`);
        }
        return response.json();
    },

    async upload<T>(endpoint: string, formData: FormData): Promise<T> {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            body: formData,
            signal: AbortSignal.timeout(REQUEST_TIMEOUT),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || `API Error: ${response.statusText}`);
        }
        return response.json();
    },

    async delete<T = void>(endpoint: string): Promise<T> {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'DELETE',
            signal: AbortSignal.timeout(REQUEST_TIMEOUT),
        });
        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }
        // Handle 204 No Content — no body to parse
        if (response.status === 204) {
            return undefined as T;
        }
        return response.json();
    },
};

export default api;
