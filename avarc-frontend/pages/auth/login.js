import { withAuth } from '../../components/withAuth';
import LoginForm from '../../components/LoginForm/LoginForm';

const LoginPage = () => {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
            <LoginForm />
        </main>
    );
};

export default withAuth(LoginPage, { requireAuth: false });
