import { useEffect, useState } from 'react';
import { apiClient } from '../services/apiClient';
import Layout from '../components/Layout';
import { withAuth } from '../components/withAuth';
import { ENDPOINTS } from '../config/endpoints';

function Dashboard({ user }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState([]);
  const [uuid, setUuid] = useState(null);

  useEffect(() => {
    const storedRoles = localStorage.getItem('roles');
    const storedUuid = localStorage.getItem('uuid');

    if (storedRoles) {
      try {
        setRoles(JSON.parse(storedRoles));
      } catch (e) {
        console.error('Failed to parse roles from localStorage', e);
        setRoles([]);
      }
    }

    if (storedUuid) {
      setUuid(storedUuid);
    }

    const fetchDashboardData = async () => {
      try {
        const result = await apiClient(ENDPOINTS.DASHBOARD.ME);
        setData(result);
        if (result.uuid) {
          setUuid(result.uuid);
          localStorage.setItem('uuid', result.uuid);
        }
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

        {uuid && (
          <div className="mt-2">
            <h2 className="text-lg font-semibold">Your UUID:</h2>
            <p className="ml-4 font-mono">{uuid}</p>
          </div>
        )}

        {roles.length > 0 && (
          <div className="mt-2">
            <h2 className="text-lg font-semibold">Your Roles:</h2>
            <ul className="list-disc list-inside ml-4">
              {roles.map((role, index) => (
                <li key={index}>{role}</li>
              ))}
            </ul>
          </div>
        )}

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
