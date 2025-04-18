import { withAuth } from '../../components/withAuth';
import UserUpdateForm from '../../components/UserUpdateForm/UserUpdateForm';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

function UpdateProfile() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
            <UserUpdateForm />
        </main>
    );
}

export async function getStaticProps({ locale }) {
    return {
        props: {
            ...(await serverSideTranslations(locale, ['common', 'user', 'api'])),
        },
    };
}

export default withAuth(UpdateProfile);
