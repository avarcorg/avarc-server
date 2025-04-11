import PropTypes from 'prop-types';
import { Button } from '../ui/button';

const UserUpdateFormView = ({
    formData,
    error,
    success,
    handleChange,
    handleSubmit,
    onCancel
}) => {
    return (
        <div className="w-full max-w-md mx-auto">
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-center">
                        Update Profile
                    </h2>

                    {error && (
                        <div className="rounded-md bg-red-50 p-4">
                            <div className="text-sm text-red-700">{error}</div>
                        </div>
                    )}

                    {success && (
                        <div className="rounded-md bg-green-50 p-4">
                            <div className="text-sm text-green-700">{success}</div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <input
                                type="text"
                                name="username"
                                placeholder="Username (leave empty to keep current)"
                                value={formData.username}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                        </div>
                        <div>
                            <input
                                type="password"
                                name="password"
                                placeholder="New Password (leave empty to keep current)"
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                        </div>
                        <div>
                            <input
                                type="password"
                                name="confirmPassword"
                                placeholder="Confirm New Password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                        </div>

                        <div className="flex space-x-4">
                            <Button
                                type="submit"
                                className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                            >
                                Update Profile
                            </Button>
                            <Button
                                type="button"
                                onClick={onCancel}
                                className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

UserUpdateFormView.propTypes = {
    formData: PropTypes.shape({
        username: PropTypes.string.isRequired,
        password: PropTypes.string.isRequired,
        confirmPassword: PropTypes.string.isRequired
    }).isRequired,
    error: PropTypes.string,
    success: PropTypes.string,
    handleChange: PropTypes.func.isRequired,
    handleSubmit: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired
};

export default UserUpdateFormView;
