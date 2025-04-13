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

    const handleLogout = async () => {
        try {
            await AuthService.logout();
        } catch (error) {
            console.error('Logout error:', error);
            // Continue with logout even if the server request fails
        } finally {
            // Always clear local storage and redirect
            localStorage.removeItem('jwt');
            localStorage.removeItem('username');
            localStorage.removeItem('uuid');
            localStorage.removeItem('roles');
            router.push('/');
        }
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
