import { AuthCard, buttonClass } from "../../components/AuthCard";

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <AuthCard title="Sign in">
      <p>Locations of historical interest. Sign in with your avarc account to continue.</p>
      {error !== undefined && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 ring-1 ring-red-200 dark:bg-red-950 dark:text-red-200 dark:ring-red-900"
        >
          The sign-in failed. Please try again.
        </p>
      )}
      <a href="/api/auth/login/keycloak" className={buttonClass}>
        Sign in
      </a>
    </AuthCard>
  );
}
