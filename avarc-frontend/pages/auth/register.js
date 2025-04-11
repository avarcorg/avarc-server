import { withAuth } from '../../components/withAuth';
import RegisterForm from '../../components/RegisterForm/RegisterForm';

const RegisterPage = () => {
    return <RegisterForm />;
};

export default withAuth(RegisterPage, { requireAuth: false });
