import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="card mx-auto max-w-lg p-8 text-center">
      <p className="text-sm font-semibold text-indigo-600">404</p>
      <h1 className="mt-1 text-lg font-semibold text-slate-900">Page not found</h1>
      <p className="mt-1 text-sm text-slate-500">The page you are looking for does not exist.</p>
      <Link href="/" className="btn btn-primary mt-6">
        Back to dashboard
      </Link>
    </div>
  );
}
