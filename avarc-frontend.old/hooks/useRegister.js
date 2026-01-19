import { useState } from 'react';
import { useRouter } from 'next/router';
import { AuthService } from '../services/authService';
import { jwtDecode } from 'jwt-decode';

export const useRegister = () => {
    const router = useRouter();
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

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
        setLoading(true);

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        try {
            const response = await AuthService.registerUser(
                formData.username,
                formData.password
            );

            if (!response.success) {
                setError(response.error || 'Registration failed');
                return;
            }

            // If we got a new token, update it and decode user info
            if (response.token) {
                try {
                    const decodedToken = jwtDecode(response.token);
                    const storedUsername = decodedToken.sub || formData.username;
                    const uuid = decodedToken.uuid;
                    const roles = decodedToken.roles || [];

                    // Store user information in localStorage
                    localStorage.setItem('jwt', response.token);
                    localStorage.setItem('username', storedUsername);
                    if (uuid) localStorage.setItem('uuid', uuid);
                    if (roles.length > 0) localStorage.setItem('roles', JSON.stringify(roles));
                } catch (decodeError) {
                    console.error('Failed to decode JWT:', decodeError);
                    setError('Failed to process registration response');
                    return;
                }
            }

            // Redirect to dashboard
            router.push('/dashboard');
        } catch (err) {
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return {
        formData,
        error,
        loading,
        handleChange,
        handleSubmit
    };
};
