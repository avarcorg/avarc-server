import { useState } from 'react';
import { useRouter } from 'next/router';
import { AuthService } from '../services/authService';
import { apiClient } from '../services/apiClient';
import { ENDPOINTS } from '../config/endpoints';

const UserUpdateForm = () => {
    const router = useRouter();
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

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
                username: formData.username,
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

            // If a new token is provided (username was updated), update it
            if (response.token) {
                localStorage.setItem('jwt', response.token);
            }

            // Update local session with new username
            localStorage.setItem('username', formData.username);

            // Refresh the current user data
            const updatedUser = await AuthService.getCurrentUser();
            if (updatedUser) {
                localStorage.setItem('username', updatedUser.username);
                if (updatedUser.uuid) localStorage.setItem('uuid', updatedUser.uuid);
                if (updatedUser.roles) localStorage.setItem('roles', JSON.stringify(updatedUser.roles));
            }

            setSuccess('Profile updated successfully!');
            setTimeout(() => {
                router.push('/dashboard');
            }, 2000);
        } catch (err) {
            if (err.status === 403) {
                setError('You do not have permission to update this profile');
            } else {
                // Show the error message from the API response if available
                setError(err.response?.data?.error || err.message || 'Failed to update profile. Please try again.');
            }
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6 text-center">Update Profile</h2>
            {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                    {error}
                </div>
            )}
            {success && (
                <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
                    {success}
                </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Username</label>
                    <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">New Password (optional)</label>
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                    <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                </div>
                <div className="flex justify-between">
                    <button
                        type="button"
                        onClick={() => router.push('/dashboard')}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                    >
                        Update Profile
                    </button>
                </div>
            </form>
        </div>
    );
};

export default UserUpdateForm;
