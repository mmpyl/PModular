import Link from 'next/link';

export default function HomePage() {
  return (
    <main>
      <h1>PymeN Boilerplate</h1>
      <p>Base enterprise modular con NestJS, Next.js, PostgreSQL JSONB y Prisma.</p>
      <Link href="/dashboard">Ir al dashboard protegido</Link>
    </main>
  );
}
