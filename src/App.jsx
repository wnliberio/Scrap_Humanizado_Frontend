import Sidebar from './components/Sidebar'
import QueryForm from './components/QueryForm'

export default function App() {
  return (
    <div className="flex h-screen">
      {/* Sidebar fijo */}
      <Sidebar />

      {/* Contenido scrollable */}
      <main className="flex-1 ml-80 overflow-y-auto">
        <header className="sticky top-0 z-10 bg-stone-900/80 backdrop-blur border-b border-stone-800">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold">
              <span className="bg-clip-text text-transparent bg-brand-gradient">
                Sedi Scrap
              </span>
            </h1>
            <span className="badge">Front de consultas</span>
          </div>
        </header>

        <section className="max-w-6xl mx-auto px-6 py-8 space-y-6">
          <div className="card">
            <h2 className="text-xl font-semibold mb-1">Consultas</h2>
            <p className="text-stone-300 mb-6">
              Marca uno o más criterios, ingresa los datos y presiona <b>Consultar</b>.
              Todos los textos se normalizan a <b>MAYÚSCULAS</b>.
            </p>
            <QueryForm />
          </div>

          <footer className="py-8 text-center text-sm text-stone-400">
            {/*Hecho con ❤️ — Layout con sidebar fijo (fixed h-full left-0 top-0 · ml-80 · overflow-y-auto)*/}
            Consultas —  públicas disponibles en desarrollo
          </footer>
        </section>
      </main>
    </div>
  )
}
