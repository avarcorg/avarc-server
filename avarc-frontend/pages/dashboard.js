import { useEffect, useState } from 'react';
import { apiClient } from '../services/apiClient';
import Layout from '../components/Layout';
import { withAuth } from '../components/withAuth';
import { ENDPOINTS } from '../config/endpoints';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { AuthService } from '../services/authService';
import { Button } from '../components/ui/button';

function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState([]);
  const [uuid, setUuid] = useState(null);
  const router = useRouter();

  const uuidFromStorage = typeof window !== 'undefined' ? localStorage.getItem('uuid') : null;
  const rolesFromStorage = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('roles') || '[]') : [];

  const handleLogout = () => {
    // TODO: In the future, implement a proper logout endpoint that:
    // 1. Invalidates the JWT token on the server side
    // 2. Clears any Redis session data
    // 3. Returns a success response before clearing local storage

    // For now, we just clear the local storage and redirect
    localStorage.removeItem('jwt');
    localStorage.removeItem('username');
    localStorage.removeItem('uuid');
    localStorage.removeItem('roles');
    router.push('/');
  };

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
