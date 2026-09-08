import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="auth-page">
      <span className="eyebrow">PModular · operación empresarial</span>
      <h1>Tu negocio, en orden.</h1>
      <p>Administra catálogo, inventario y ventas desde un único espacio de trabajo.</p>
      <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
        <Link className="primary-link" href="/login" style={{ textAlign: 'center' }}>Entrar al sistema</Link>
        <Link href="/register" style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--muted)' }}>Crear cuenta nueva</Link>
      </div>
    </main>
  );
}
