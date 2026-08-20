import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex-1 flex items-center justify-center px-6 py-24">
      <div className="text-center max-w-md">
        <p className="text-xs uppercase tracking-[0.3em] text-gold mb-4">Off The Map</p>
        <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">This One&apos;s Not Here</h1>
        <p className="text-neutral-400 mb-8">
          The page you&apos;re after doesn&apos;t exist, or it moved. Head back and pick up where you left off.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="btn-gold inline-block">Back to Home</Link>
          <Link
            href="/apply"
            className="border border-border rounded-lg px-6 py-3 text-neutral-200 hover:border-gold transition-colors"
          >
            Apply to Perform
          </Link>
        </div>
      </div>
    </main>
  );
}
