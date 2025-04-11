import PropTypes from 'prop-types';
import Link from 'next/link';
import { Button } from '../ui/button';

const DashboardView = ({
    data,
    error,
    loading,
    roles,
    uuid,
    handleLogout
}) => {
    if (error) {
        return (
            <div className="text-red-600">Error: {error}</div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Dashboard</h1>
                <Button
                    onClick={handleLogout}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                    Logout
                </Button>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">User Information</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-gray-600">Username:</p>
                        <p className="font-medium">{data?.username || 'Loading...'}</p>
                    </div>
                    <div>
                        <p className="text-gray-600">UUID:</p>
                        <p className="font-medium">{uuid || 'Loading...'}</p>
                    </div>
                    <div>
                        <p className="text-gray-600">Roles:</p>
                        <p className="font-medium">{roles.join(', ') || 'No roles assigned'}</p>
                    </div>
                </div>
                <div className="mt-6">
                    <Link
                        href="/profile/update"
                        className="inline-block bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors"
                    >
                        Update Profile
                    </Link>
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
