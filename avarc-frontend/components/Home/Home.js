import { useHome } from '../../hooks/useHome';
import HomeView from './HomeView';

const Home = () => {
    const {
        handleLogin,
        handleRegister
    } = useHome();

    return (
        <div data-filename="Home.js">
            <HomeView
                handleLogin={handleLogin}
                handleRegister={handleRegister}
            />
        </div>
    );
};

export default Home;
