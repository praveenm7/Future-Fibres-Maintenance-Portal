const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002/api';

const REQUEST_TIMEOUT = 30000; // 30 seconds

/** Read entity IDs from localStorage for every request */
function getEntityHeaders(): Record<string, string> {
    const active = localStorage.getItem('ff-active-entity') || '1';
    const home = localStorage.getItem('ff-home-entity') || '1';
    return {
        'X-Entity-ID': active,
        'X-Home-Entity-ID': home,
    };
}

/** Throws if the user is in read-only mode (viewing non-home entity) */
function assertWriteAccess() {
    const active = localStorage.getItem('ff-active-entity') || '1';
    const home = localStorage.getItem('ff-home-entity') || '1';
    if (active !== home) {
        throw new Error('Read-only mode: switch to your home entity to make changes');
    }
}

/**
 * Generic API Client with typed request/response, timeout, entity headers,
 * and safe DELETE handling.
 */
export const api = {
    async get<T>(endpoint: string, extraHeaders?: Record<string, string>): Promise<T> {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: { ...getEntityHeaders(), ...extraHeaders },
            signal: AbortSignal.timeout(REQUEST_TIMEOUT),
        });
        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }
        return response.json();
    },

    async post<T, D = unknown>(endpoint: string, data: D, extraHeaders?: Record<string, string>): Promise<T> {
        assertWriteAccess();
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getEntityHeaders(),
                ...extraHeaders,
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

    async put<T, D = unknown>(endpoint: string, data: D, extraHeaders?: Record<string, string>): Promise<T> {
        assertWriteAccess();
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...getEntityHeaders(),
                ...extraHeaders,
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
        assertWriteAccess();
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: { ...getEntityHeaders() },
            body: formData,
            signal: AbortSignal.timeout(REQUEST_TIMEOUT),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || `API Error: ${response.statusText}`);
        }
        return response.json();
    },

    async patch<T, D = unknown>(endpoint: string, data: D): Promise<T> {
        assertWriteAccess();
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...getEntityHeaders(),
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

    /** POST that does NOT require write access (for read-only queries like report execution) */
    async query<T, D = unknown>(endpoint: string, data: D, extraHeaders?: Record<string, string>): Promise<T> {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getEntityHeaders(),
                ...extraHeaders,
            },
            body: JSON.stringify(data),
            signal: AbortSignal.timeout(REQUEST_TIMEOUT),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || error.error || `API Error: ${response.statusText}`);
        }
        return response.json();
    },

    async delete<T = void>(endpoint: string, extraHeaders?: Record<string, string>): Promise<T> {
        assertWriteAccess();
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'DELETE',
            headers: { ...getEntityHeaders(), ...extraHeaders },
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
