export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main>
      <h1>Sign in</h1>
      {error !== undefined && <p role="alert">The sign-in failed. Please try again.</p>}
      <p>You sign in with your avarc account.</p>
      <p>
        <a href="/api/auth/login/keycloak">Sign in</a>
      </p>
    </main>
  );
}
