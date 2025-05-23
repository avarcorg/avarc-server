import { useLogin } from '../../hooks/useLogin';
import LoginFormView from './LoginFormView';

const LoginForm = () => {
    const {
        formData,
        error,
        loading,
        handleChange,
        handleSubmit
    } = useLogin();

    return (
        <div data-filename="LoginForm.js">
            <LoginFormView
                formData={formData}
                error={error}
                loading={loading}
                handleChange={handleChange}
                handleSubmit={handleSubmit}
            />
        </div>
    );
};

export default LoginForm;
