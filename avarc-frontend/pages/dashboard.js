import { useEffect, useState } from 'react';
import { apiClient } from '../services/apiClient';
import Layout from '../components/Layout';
import { withAuth } from '../components/withAuth';
import { ENDPOINTS } from '../config/endpoints';

function Dashboard({ user }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const result = await apiClient(ENDPOINTS.DASHBOARD.ME);
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (error) {
    return (
      <Layout>
        <div className="text-red-600">Error: {error}</div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div>Loading dashboard data...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div>
        <h1>Welcome, {user.username}!</h1>
        {data && (
          <div>
            {/* Render your dashboard data here */}
          </div>
        )}
      </div>
    </Layout>
  );
}

export default withAuth(Dashboard);
