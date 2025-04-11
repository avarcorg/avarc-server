import { withAuth } from '../../components/withAuth';
import UserUpdateForm from '../../components/UserUpdateForm';
import Layout from '../../components/Layout';

function UpdateProfile() {
    return (
        <Layout>
            <UserUpdateForm />
        </Layout>
    );
}

export default withAuth(UpdateProfile);
