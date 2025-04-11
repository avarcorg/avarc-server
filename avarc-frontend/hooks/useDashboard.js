import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { AuthService } from '../services/authService';

export const useDashboard = () => {
    const router = useRouter();
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [roles, setRoles] = useState([]);
    const [uuid, setUuid] = useState(null);

    const handleLogout = () => {
        // TODO: In the future, implement a proper logout endpoint that:
        // 1. Invalidates the JWT token on the server side
        // 2. Clears any Redis session data
        // 3. Returns a success response before clearing local storage

        // For now, we just clear the local storage and redirect
        localStorage.removeItem('jwt');
        localStorage.removeItem('username');
        localStorage.removeItem('uuid');
        localStorage.removeItem('roles');
        router.push('/');
    };

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const userData = await AuthService.getCurrentUser();
                setData(userData);
                if (userData) {
                    localStorage.setItem('username', userData.username);
                    if (userData.uuid) {
                        setUuid(userData.uuid);
                        localStorage.setItem('uuid', userData.uuid);
                    }
                    if (userData.roles) {
                        setRoles(userData.roles);
                        localStorage.setItem('roles', JSON.stringify(userData.roles));
                    }
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    return {
        data,
        error,
        loading,
        roles,
        uuid,
        handleLogout
    };
};
