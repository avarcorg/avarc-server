import { withAuth } from '../../components/withAuth';
import LoginForm from '../../components/LoginForm/LoginForm';

const LoginPage = () => {
    return <LoginForm />;
};

export default withAuth(LoginPage, { requireAuth: false });
