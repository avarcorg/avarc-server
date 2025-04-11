import { useRegister } from '../../hooks/useRegister';
import RegisterFormView from './RegisterFormView';
import Layout from '../Layout';

const RegisterForm = () => {
    const {
        formData,
        error,
        loading,
        handleChange,
        handleSubmit
    } = useRegister();

    return (
        <Layout>
            <RegisterFormView
                formData={formData}
                error={error}
                loading={loading}
                handleChange={handleChange}
                handleSubmit={handleSubmit}
            />
        </Layout>
    );
};

export default RegisterForm;
