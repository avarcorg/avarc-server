import { useState } from 'react';
import { useRouter } from 'next/router';
import { AuthService } from '../services/authService';

export const useLogin = () => {
    const router = useRouter();
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
            const response = await AuthService.loginUser(
                formData.username,
                formData.password
            );

            if (!response.success) {
                setError(response.error || 'Login failed');
                return;
            }

            // Redirect to dashboard
            router.push('/dashboard');
        } catch (err) {
            setError(err.message || 'Login failed. Please try again.');
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
