import { useRouter } from 'next/router';

export const useHome = () => {
    const router = useRouter();

    const handleLogin = () => {
        router.push('/auth/login');
    };

    const handleRegister = () => {
        router.push('/auth/register');
    };

    return {
        handleLogin,
        handleRegister
    };
};
