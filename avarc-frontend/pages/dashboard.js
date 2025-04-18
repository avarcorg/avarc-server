import { withAuth } from '../components/withAuth';
import Dashboard from '../components/Dashboard/Dashboard';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

const DashboardPage = () => {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
            <Dashboard />
        </main>
    );
};

export async function getStaticProps({ locale }) {
    return {
        props: {
            ...(await serverSideTranslations(locale, ['common', 'dashboard', 'api'])),
        },
    };
}

export default withAuth(DashboardPage);
