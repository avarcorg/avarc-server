import { useHome } from '../../hooks/useHome';
import HomeView from './HomeView';

const Home = () => {
    const {
        handleLogin,
        handleRegister
    } = useHome();

    return (
        <HomeView
            handleLogin={handleLogin}
            handleRegister={handleRegister}
        />
    );
};

export default Home;
