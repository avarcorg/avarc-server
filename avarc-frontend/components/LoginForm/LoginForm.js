import { useLogin } from '../../hooks/useLogin';
import LoginFormView from './LoginFormView';
import Layout from '../Layout';

const LoginForm = () => {
    const {
        formData,
        error,
        loading,
        handleChange,
        handleSubmit
    } = useLogin();

    return (
        <Layout>
            <LoginFormView
                formData={formData}
                error={error}
                loading={loading}
                handleChange={handleChange}
                handleSubmit={handleSubmit}
            />
        </Layout>
    );
};

export default LoginForm;
