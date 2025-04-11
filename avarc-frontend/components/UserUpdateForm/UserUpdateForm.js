import { useRouter } from 'next/router';
import { useUserUpdate } from '../../hooks/useUserUpdate';
import UserUpdateFormView from './UserUpdateFormView';

const UserUpdateForm = () => {
    const router = useRouter();
    const {
        formData,
        error,
        success,
        handleChange,
        handleSubmit
    } = useUserUpdate();

    const handleCancel = () => {
        router.push('/dashboard');
    };

    return (
        <UserUpdateFormView
            formData={formData}
            error={error}
            success={success}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
            onCancel={handleCancel}
        />
    );
};

export default UserUpdateForm;
