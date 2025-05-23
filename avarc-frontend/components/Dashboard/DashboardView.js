import PropTypes from 'prop-types';
import Link from 'next/link';
import { Button } from '../ui/button';
import { useSafeTranslation } from '../../utils/translation';

const DashboardView = ({
    data,
    error,
    loading,
    roles,
    uuid,
    handleLogout
}) => {
    const { safeTranslate } = useSafeTranslation(['dashboard', 'api']);

    if (error) {
        return (
            <div className="w-full max-w-md mx-auto">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="text-sm text-red-700">{safeTranslate(error, 'api')}</div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md mx-auto" data-filename="DashboardView.js">
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-bold">{safeTranslate('title', 'dashboard')}</h1>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold">{safeTranslate('userInfo', 'dashboard')}</h2>
                        <div className="space-y-4">
                            <div>
                                <p className="text-gray-600">{safeTranslate('username', 'dashboard')}:</p>
                                <p className="font-medium">
                                    {data?.username || localStorage.getItem('username') || safeTranslate('loading', 'dashboard')}
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-600">{safeTranslate('uuid', 'dashboard')}:</p>
                                <p className="font-medium">{uuid || safeTranslate('loading', 'dashboard')}</p>
                            </div>
                            <div>
                                <p className="text-gray-600">{safeTranslate('roles', 'dashboard')}:</p>
                                <p className="font-medium">
                                    {roles.length > 0
                                        ? roles.join(', ')
                                        : safeTranslate('noRoles', 'dashboard')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

DashboardView.propTypes = {
    data: PropTypes.shape({
        username: PropTypes.string
    }),
    error: PropTypes.string,
    loading: PropTypes.bool.isRequired,
    roles: PropTypes.arrayOf(PropTypes.string).isRequired,
    uuid: PropTypes.string,
    handleLogout: PropTypes.func.isRequired
};

export default DashboardView;
