import { useDashboard } from '../../hooks/useDashboard';
import DashboardView from './DashboardView';
import Layout from '../Layout';

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
        <Layout>
            <DashboardView
                data={data}
                error={error}
                loading={loading}
                roles={roles}
                uuid={uuid}
                handleLogout={handleLogout}
            />
        </Layout>
    );
};

export default Dashboard;
