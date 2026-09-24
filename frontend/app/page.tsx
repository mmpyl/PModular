import Link from 'next/link';

export default function HomePage() {
  return (
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
      </div>
    </main>
  );
}
