import { useEffect, useState } from 'react';
import { apiClient } from '../services/apiClient';
import Layout from '../components/Layout';
import { withAuth } from '../components/withAuth';
import { ENDPOINTS } from '../config/endpoints';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { AuthService } from '../services/authService';

function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState([]);
  const [uuid, setUuid] = useState(null);
  const router = useRouter();

  const uuidFromStorage = typeof window !== 'undefined' ? localStorage.getItem('uuid') : null;
  const rolesFromStorage = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('roles') || '[]') : [];

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await AuthService.getCurrentUser();
        setData(userData);
        if (userData) {
          localStorage.setItem('username', userData.username);
          if (userData.uuid) {
            setUuid(userData.uuid);
            localStorage.setItem('uuid', userData.uuid);
          }
          if (userData.roles) {
            setRoles(userData.roles);
            localStorage.setItem('roles', JSON.stringify(userData.roles));
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
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
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">User Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600">Username:</p>
              <p className="font-medium">{data?.username}</p>
            </div>
            <div>
              <p className="text-gray-600">UUID:</p>
              <p className="font-medium">{uuid}</p>
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
    </Layout>
  );
}

export default withAuth(Dashboard);
