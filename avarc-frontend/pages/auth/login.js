import { withAuth } from '../../components/withAuth';
import LoginForm from '../../components/LoginForm/LoginForm';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

const LoginPage = () => {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
            <LoginForm />
        </main>
    );
};

export async function getStaticProps({ locale }) {
    return {
        props: {
            ...(await serverSideTranslations(locale, ['common', 'auth', 'api'])),
        },
    };
}

export default withAuth(LoginPage, { requireAuth: false });
