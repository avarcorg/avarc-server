import { useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { AuthService } from '../../services/authService';
import Layout from '../../components/Layout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { CONFIG } from '../../config/config';

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await AuthService.loginUser(username, password);
      if (response && response.user) {
        // Store user data in localStorage
        localStorage.setItem('username', response.user.username);
        if (response.user.uuid) {
          localStorage.setItem('uuid', response.user.uuid);
        }
        if (response.user.roles) {
          localStorage.setItem('roles', JSON.stringify(response.user.roles));
        }

        // Redirect to dashboard
        router.push('/dashboard');
      } else {
        setError('Login successful but no user data received');
      }
    } catch (error) {
      setError(error.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
        <div className="w-full max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                {error}
              </div>
            )}
            <div className="space-y-6">
              {CONFIG.OAUTH_WITH_GOOGLE && (
                <>
                  <Button
                    type="button"
                    className="flex items-center justify-center w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    <Image
                      src="/external/google-logo.svg"
                      alt="Google logo"
                      width={20}
                      height={20}
                      className="mr-2"
                    />
                    Continue with Google
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">OR</span>
                    </div>
                  </div>
                </>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loading}
                    placeholder="Enter your username"
                    required
                  />
                </div>
                <div>
                  <Input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    placeholder="Enter your password"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:bg-gray-400"
                >
                  {loading ? 'Logging in...' : 'Continue with Username'}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
