import { withAuth } from '../components/withAuth';
import Dashboard from '../components/Dashboard/Dashboard';

const DashboardPage = () => {
    return <Dashboard />;
};

export default withAuth(DashboardPage);
