import sidebarImg from '../assets/sidebar.jpg'

export default function Sidebar() {
  return (
    <aside
      className="fixed h-full left-0 top-0 w-80 text-white shadow-soft"
      style={{
        backgroundImage: `linear-gradient(180deg, rgba(0,0,0,.55), rgba(0,0,0,.7)), url(${sidebarImg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="h-full flex flex-col">
        <div className="p-6">
          <div className="inline-flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-brand-gradient" />
            <div>
              <div className="text-lg font-bold tracking-wide">Sedi Scrap</div>
              <div className="text-xs text-stone-300">Panel de consultas</div>
            </div>
          </div>
        </div>

        <nav className="px-6 space-y-2">
          <a className="block px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition">
            Inicio
          </a>
          <a className="block px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition">
            Consultas
          </a>
          <a className="block px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition">
            Historial (próx.)
          </a>
        </nav>

        <div className="mt-auto p-6 text-xs text-stone-300">
          © {new Date().getFullYear()} Sedi. Todos los derechos reservados.
        </div>
      </div>
    </aside>
  )
}
