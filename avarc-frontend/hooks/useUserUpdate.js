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
    const [uuid, setUuid] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const { t } = useTranslation(['auth', 'api']);

    useEffect(() => {
        const loadCurrentUser = async () => {
            try {
                console.log('[useUserUpdate] Loading current user...');
                const currentUser = await AuthService.getCurrentUser();
                console.log('[useUserUpdate] Current user data:', currentUser);

                if (currentUser) {
                    setFormData(prev => ({
                        ...prev,
                        username: currentUser.username || ''
                    }));

                    if (currentUser.uuid) {
                        console.log('[useUserUpdate] Setting UUID:', currentUser.uuid);
                        setUuid(currentUser.uuid);
                        localStorage.setItem('uuid', currentUser.uuid);
                    } else {
                        console.error('[useUserUpdate] No UUID in current user data');
                        setError('User ID not found. Please try logging in again.');
                    }
                } else {
                    console.error('[useUserUpdate] No current user data received');
                    setError('Failed to load user data');
                }
            } catch (err) {
                console.error('[useUserUpdate] Failed to load current user:', err);
                setError('Failed to load user data. Please try logging in again.');
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

        if (!uuid) {
            console.error('[useUserUpdate] No UUID available for update');
            setError('User ID not found. Please try logging in again.');
            return;
        }

        try {
            console.log('[useUserUpdate] Updating user with UUID:', uuid);
            const updateData = {
                ...(formData.username && { username: formData.username }),
                ...(formData.password && { password: formData.password })
            };
            console.log('[useUserUpdate] Update data:', updateData);

            const response = await AuthService.updateUser(uuid, updateData);
            console.log('[useUserUpdate] Update response:', response);

            if (!response.success) {
                setError(response.error);
                return;
            }

            setSuccess('Profile updated successfully!');
            setTimeout(() => {
                router.push('/dashboard');
            }, 2000);
        } catch (err) {
            console.error('[useUserUpdate] Update error:', err);
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
