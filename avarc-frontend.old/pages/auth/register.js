import { withAuth } from '../../components/withAuth';
import RegisterForm from '../../components/RegisterForm/RegisterForm';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

const RegisterPage = () => {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
            <RegisterForm />
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

export default withAuth(RegisterPage, { requireAuth: false });
