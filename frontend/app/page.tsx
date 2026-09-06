import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="auth-page">
      <span className="eyebrow">PModular · operación empresarial</span>
      <h1>Tu negocio, en orden.</h1>
      <p>Administra catálogo, inventario y ventas desde un único espacio de trabajo.</p>
      <Link className="primary-link" href="/login">Entrar al sistema</Link>
    </main>
  );
}
