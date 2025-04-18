import Home from '../components/Home/Home';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

const IndexPage = () => {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
            <Home />
        </main>
    );
};

export async function getStaticProps({ locale }) {
    return {
        props: {
            ...(await serverSideTranslations(locale, ['common', 'auth', 'api', 'home'])),
        },
    };
}

export default IndexPage;
