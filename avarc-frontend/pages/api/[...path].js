import axios from 'axios';
import { API_CONFIG } from '../../config';

// Create axios instance for server-side requests
const serverAxios = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_HOST || API_CONFIG.HOST,
    headers: {
        'Content-Type': 'application/json',
        'accept': '*/*'
    },
});

export default async function handler(req, res) {
    // Get the full path from the request
    const path = req.query.path.join('/');

    // If path starts with 'rest/v0.1.0', use it as is, otherwise add the prefix
    const fullPath = path.startsWith('rest/v0.1.0/') ? path : `rest/v0.1.0/${path}`;

    console.log('[api] Request:', {
        originalPath: path,
        fullPath,
        method: req.method,
        headers: req.headers,
        backendUrl: `${process.env.NEXT_PUBLIC_API_HOST || API_CONFIG.HOST}/${fullPath}`
    });

    try {
        // Forward the request to the backend
        const response = await serverAxios({
            method: req.method,
            url: fullPath,
            data: req.body,
            headers: {
                'accept': '*/*',
                'Content-Type': 'application/json',
                'host': new URL(process.env.NEXT_PUBLIC_API_HOST || API_CONFIG.HOST).host,
                // Forward authorization header if present
                ...(req.headers.authorization && { 'authorization': req.headers.authorization })
            }
        });

        // Forward the response back to the client
        return res.status(response.status).json(response.data);
    } catch (error) {
        console.error(`[api/${path}] Error:`, {
            message: error.message,
            response: {
                status: error.response?.status,
                statusText: error.response?.statusText,
                headers: error.response?.headers,
                data: error.response?.data
            },
            request: {
                url: error.config?.url,
                method: error.config?.method,
                headers: error.config?.headers,
                data: error.config?.data
            }
        });
        return res.status(error.response?.status || 500).json(error.response?.data || { message: 'Internal server error' });
    }
}
