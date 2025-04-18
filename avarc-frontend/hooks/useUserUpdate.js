import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { AuthService } from '../services/authService';
import { useTranslation } from 'next-i18next';

export const useUserUpdate = () => {
    const router = useRouter();
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const { t } = useTranslation(['auth', 'api']);

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
                setError('Failed to load user data');
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

            const response = await AuthService.updateUser(currentUser.uuid, updateData);

            if (!response.success) {
                setError(response.error);
                return;
            }

            setSuccess('Profile updated successfully!');
            setTimeout(() => {
                router.push('/dashboard');
            }, 2000);
        } catch (err) {
            setError(err.message || 'Failed to update profile. Please try again.');
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
