import { useRegister } from '../../hooks/useRegister';
import RegisterFormView from './RegisterFormView';

const RegisterForm = () => {
    const {
        formData,
        error,
        loading,
        handleChange,
        handleSubmit
    } = useRegister();

    return (
        <div>
            <RegisterFormView
                formData={formData}
                error={error}
                loading={loading}
                handleChange={handleChange}
                handleSubmit={handleSubmit}
            />
        </div>
    );
};

export default RegisterForm;
