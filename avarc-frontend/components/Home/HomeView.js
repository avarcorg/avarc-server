import PropTypes from 'prop-types';
import Image from 'next/image';
import { Button } from '../ui/button';
import { CONFIG } from '../../config';
import { useSafeTranslation } from '../../utils/translation';

const HomeView = ({
    handleLogin,
    handleRegister
}) => {
    const { safeTranslate } = useSafeTranslation(['common', 'auth', 'api', 'home']);

    return (
        <div className="w-full max-w-md mx-auto">
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="space-y-6">
                    <h1 className="text-2xl font-bold text-center">
                        {safeTranslate('welcome', 'home')}
                    </h1>

                    {CONFIG.OAUTH_WITH_GOOGLE && (
                        <>
                            <Button
                                type="button"
                                className="flex items-center justify-center w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                            >
                                <img
                                    src="/external/google-logo.svg"
                                    alt={safeTranslate('login.googleLogoAlt', 'auth')}
                                    width={20}
                                    height={20}
                                    className="mr-2"
                                />
                                {safeTranslate('login.continueWithGoogle', 'auth')}
                            </Button>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-300" />
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white text-gray-500">{safeTranslate('login.or', 'auth')}</span>
                                </div>
                            </div>
                        </>
                    )}

                    <div className="space-y-4">
                        <Button
                            onClick={handleLogin}
                            className="w-full"
                        >
                            {safeTranslate('login.continueWithUsername', 'auth')}
                        </Button>
                        <Button
                            onClick={handleRegister}
                            className="w-full"
                            variant="outline"
                        >
                            {safeTranslate('register.createAccount', 'auth')}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

HomeView.propTypes = {
    handleLogin: PropTypes.func.isRequired,
    handleRegister: PropTypes.func.isRequired,
};

export default HomeView;
