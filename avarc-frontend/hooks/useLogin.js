import { useState } from 'react';
import { useRouter } from 'next/router';
import { AuthService } from '../services/authService';
import { useTranslation } from 'next-i18next';

export const useLogin = () => {
    const router = useRouter();
    const { t } = useTranslation(['auth', 'api']);
    const [formData, setFormData] = useState({
        username: '',
        password: ''
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

        try {
            console.log('[useLogin] Starting login process for username:', formData.username);
            const response = await AuthService.loginUser(
                formData.username,
                formData.password
            );
            console.log('[useLogin] authService.loginUser result:', response);

            if (!response.success) {
                console.log('[useLogin] Login failed:', response.error);
                setError(response.error);
                return;
            }

            console.log('[useLogin] Login successful, navigating to dashboard');
            router.push('/dashboard');
        } catch (err) {
            console.error('[useLogin] Login error:', err);
            setError(err.message || 'An unexpected error occurred');
        } finally {
            console.log('[useLogin] Login process completed');
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
