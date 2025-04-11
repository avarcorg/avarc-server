import { withAuth } from '../../components/withAuth';
import RegisterForm from '../../components/RegisterForm/RegisterForm';

const RegisterPage = () => {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
            <RegisterForm />
        </main>
    );
};

export default withAuth(RegisterPage, { requireAuth: false });
