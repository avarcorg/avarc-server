import { useDashboard } from '../../hooks/useDashboard';
import DashboardView from './DashboardView';

const Dashboard = () => {
    const {
        data,
        error,
        loading,
        roles,
        uuid,
        handleLogout
    } = useDashboard();

    return (
        <div>
            <DashboardView
                data={data}
                error={error}
                loading={loading}
                roles={roles}
                uuid={uuid}
                handleLogout={handleLogout}
            />
        </div>
    );
};

export default Dashboard;
