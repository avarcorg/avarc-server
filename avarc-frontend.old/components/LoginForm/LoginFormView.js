import PropTypes from 'prop-types';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '../ui/button';
import { CONFIG } from '../../config';
import { useSafeTranslation } from '../../utils/translation';

const LoginFormView = ({
    formData,
    error,
    loading,
    handleChange,
    handleSubmit
}) => {
    const { safeTranslate } = useSafeTranslation(['auth', 'api']);

    return (
        <div className="w-full max-w-md mx-auto" data-filename="LoginFormView.js">
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="space-y-6">
                    {CONFIG.OAUTH_WITH_GOOGLE && (
                        <>
                            <Button
                                type="button"
                                className="flex items-center justify-center w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                            >
                                <Image
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

                    {error && (
                        <div className="rounded-md bg-red-50 p-4">
                            <div className="text-sm text-red-700">{error}</div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <input
                                type="text"
                                name="username"
                                placeholder={safeTranslate('login.usernamePlaceholder', 'auth')}
                                value={formData.username}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                required
                            />
                        </div>
                        <div>
                            <input
                                type="password"
                                name="password"
                                placeholder={safeTranslate('login.passwordPlaceholder', 'auth')}
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                required
                            />
                        </div>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                        >
                            {loading ? safeTranslate('login.signingIn', 'auth') : safeTranslate('login.continueWithUsername', 'auth')}
                        </Button>
                    </form>

                    <div className="text-sm text-center">
                        <Link href="/auth/register" className="font-medium text-gray-600 hover:text-gray-900">
                            {safeTranslate('login.noAccount', 'auth')}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

LoginFormView.propTypes = {
    formData: PropTypes.shape({
        username: PropTypes.string.isRequired,
        password: PropTypes.string.isRequired
    }).isRequired,
    error: PropTypes.string,
    loading: PropTypes.bool.isRequired,
    handleChange: PropTypes.func.isRequired,
    handleSubmit: PropTypes.func.isRequired
};

export default LoginFormView;
