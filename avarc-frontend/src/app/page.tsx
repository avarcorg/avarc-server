export default function HomePage() {
  return (
    <section className="card">
      <h1>avArc Frontend</h1>
      <p>
        Next.js {process.env.NEXT_PUBLIC_VERSION ?? "16.1.3"} is configured and
        ready to build.
      </p>
      <p>
        Update this page in <code>src/app/page.tsx</code> to start building the
        UI.
      </p>
    </section>
  );
}
