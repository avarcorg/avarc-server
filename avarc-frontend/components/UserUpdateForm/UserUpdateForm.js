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
        <div>
            <UserUpdateFormView
                formData={formData}
                error={error}
                success={success}
                handleChange={handleChange}
                handleSubmit={handleSubmit}
                onCancel={handleCancel}
            />
        </div>
    );
};

export default UserUpdateForm;
