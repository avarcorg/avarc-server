import { withAuth } from '../components/withAuth';
import Dashboard from '../components/Dashboard/Dashboard';

const DashboardPage = () => {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
            <Dashboard />
        </main>
    );
};

export default withAuth(DashboardPage);
