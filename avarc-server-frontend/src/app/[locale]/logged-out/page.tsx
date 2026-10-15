import { AuthCard, buttonClass } from "../../components/AuthCard";

export default function LoggedOut() {
  return (
    <AuthCard title="Logged out">
      <p>You have been logged out. See you soon.</p>
      <a href="/login" className={buttonClass}>
        Sign in again
      </a>
    </AuthCard>
  );
}
