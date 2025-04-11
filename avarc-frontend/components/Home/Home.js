import { useHome } from '../../hooks/useHome';
import HomeView from './HomeView';
import Layout from '../Layout';

const Home = () => {
    const {
        handleLogin,
        handleRegister
    } = useHome();

    return (
        <Layout>
            <HomeView
                handleLogin={handleLogin}
                handleRegister={handleRegister}
            />
        </Layout>
    );
};

export default Home;
