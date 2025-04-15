import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { AuthService } from '../services/authService';
import { apiClient } from '../services/apiClient';
import { ENDPOINTS } from '../config';
import { jwtDecode } from 'jwt-decode';

export const useUserUpdate = () => {
    const router = useRouter();
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const loadCurrentUser = async () => {
            try {
                const currentUser = await AuthService.getCurrentUser();
                if (currentUser) {
                    setFormData(prev => ({
                        ...prev,
                        username: currentUser.username
                    }));
                }
            } catch (err) {
                console.error('Failed to load current user:', err);
            }
        };
        loadCurrentUser();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        try {
            const currentUser = await AuthService.getCurrentUser();
            if (!currentUser) {
                setError('You must be logged in to update your profile');
                return;
            }

            const updateData = {
                ...(formData.username && { username: formData.username }),
                ...(formData.password && { password: formData.password })
            };

            const response = await apiClient(`${ENDPOINTS.USERS.BASE}/${currentUser.uuid}`, {
                method: 'PUT',
                body: JSON.stringify(updateData),
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.error) {
                setError(response.error);
                return;
            }

            // If we got a new token, update it and decode user info
            if (response.token) {
                localStorage.setItem('jwt', response.token);
                try {
                    const decodedToken = jwtDecode(response.token);
                    const storedUsername = decodedToken.sub || formData.username;
                    const uuid = decodedToken.uuid;
                    const roles = decodedToken.roles || [];

                    // Update all user information in localStorage
                    localStorage.setItem('username', storedUsername);
                    if (uuid) localStorage.setItem('uuid', uuid);
                    if (roles.length > 0) localStorage.setItem('roles', JSON.stringify(roles));
                } catch (decodeError) {
                    console.error('Failed to decode JWT:', decodeError);
                    setError('Failed to update session information');
                    return;
                }
            }

            setSuccess('Profile updated successfully!');
            setTimeout(() => {
                router.push('/dashboard');
            }, 2000);
        } catch (err) {
            if (err.status === 403) {
                setError('You do not have permission to update this profile');
            } else {
                setError(err.response?.data?.error || err.message || 'Failed to update profile. Please try again.');
            }
        }
    };

    return {
        formData,
        error,
        success,
        handleChange,
        handleSubmit
    };
};
