import { withAuth } from '../../components/withAuth';
import UserUpdateForm from '../../components/UserUpdateForm/UserUpdateForm';

function UpdateProfile() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
            <UserUpdateForm />
        </main>
    );
}

export default withAuth(UpdateProfile);
