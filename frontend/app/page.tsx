import Link from 'next/link';

export default function HomePage() {
  return (
<<<<<<< HEAD
    <main className="auth-page">
      <span className="eyebrow">PModular · operación empresarial</span>
      <h1>Tu negocio, en orden.</h1>
      <p>Administra catálogo, inventario y ventas desde un único espacio de trabajo.</p>
      <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
        <Link className="primary-link" href="/login" style={{ textAlign: 'center' }}>Entrar al sistema</Link>
        <Link href="/platform/login" style={{ textAlign: 'center', fontSize: '0.875rem' }}>Acceso de propietario global</Link>
        <Link href="/register" style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--muted)' }}>Crear cuenta nueva</Link>
=======
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-muted/50 to-white p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">PModular · operación empresarial</p>
          <h1 className="text-4xl font-bold tracking-tight">Tu negocio, en orden.</h1>
          <p className="text-muted-foreground">Administra catálogo, inventario y ventas desde un único espacio de trabajo.</p>
        </div>
        <div className="space-y-3">
          <Link href="/login" className="block w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium py-3 px-4 rounded-md transition-colors text-center">Entrar al sistema</Link>
          <Link href="/register" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Crear cuenta nueva</Link>
        </div>
>>>>>>> e206d198e942f03be69312c7a5e9542c210e8540
      </div>
    </main>
  );
}
