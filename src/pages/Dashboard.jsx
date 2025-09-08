// src/pages/Dashboard.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  listLista,
  updateListaEstado,
  createConsultas,
  getJobStatus,
  getReportByJob,
  downloadReportUrl,
} from "../lib/api";

const styles = {
  wrap: { padding: 16, maxWidth: 1250, margin: "0 auto" },
  h1: { fontSize: 28, fontWeight: 800, marginBottom: 12 },
  toolbar: { display: "grid", gridTemplateColumns: "220px 220px 220px 1fr 120px", gap: 10, alignItems: "end", marginBottom: 12 },
  select: { width: "100%", padding: 8 },
  input: { width: "100%", padding: 8 },
  button: { padding: "10px 14px", background: "#0b74de", color: "#fff", border: 0, borderRadius: 6, cursor: "pointer", fontWeight: 600 },
  counters: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 12 },
  card: (bg, color = "#111") => ({ background: bg, color, padding: 14, borderRadius: 10, boxShadow: "0 2px 8px rgba(0,0,0,.08)", fontWeight: 700, textAlign: "center" }),
  table: { width: "100%", borderCollapse: "collapse", background: "#fff", boxShadow: "0 2px 10px rgba(0,0,0,.08)", borderRadius: 8, overflow: "hidden" },
  th: { background: "linear-gradient(135deg, #667eea, #764ba2)", color: "#fff", textTransform: "uppercase", fontSize: 12, letterSpacing: 1, padding: 12, textAlign: "left" },
  td: { padding: 12, borderBottom: "1px solid #eee" },
  badge: (bg, color = "#fff") => ({ display: "inline-block", padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: bg, color }),
  btnMini: { padding: "6px 10px", background: "#0b74de", color: "#fff", border: 0, borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 700 },

  // Modal
  modalBg: {
    position: "fixed",
    top: 0, left: 0, width: "100%", height: "100%",
    background: "rgba(0,0,0,0.7)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 99999, backdropFilter: "blur(2px)"
  },
  modal: { width: 820, maxWidth: "95vw", background: "#fff", borderRadius: 8, overflow: "hidden", boxShadow: "0 14px 40px rgba(0,0,0,.25)" },
  modalHead: { background: "linear-gradient(90deg, #0b74de, #1d4ed8)", color: "#fff", padding: 12, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "space-between" },
  modalBody: { padding: 16 },
  modalFoot: { padding: 12, display: "flex", justifyContent: "flex-end", gap: 10 },
};

const ESTADOS = ["Todos", "Pendiente", "Procesando", "Procesado", "Error"];

function EstadoPill({ estado }) {
  const map = {
    Pendiente: styles.badge("#ffecb3", "#6b5b00"),
    Procesando: styles.badge("#e0f2fe", "#075985"),
    Procesado: styles.badge("#e8f5e9", "#1b5e20"),
    Error: styles.badge("#ffebee", "#b71c1c"),
  };
  return <span style={map[estado] || styles.badge("#eee", "#333")}>{estado}</span>;
}

function formatMoney(v) {
  if (v === null || v === undefined) return "—";
  return `$${Number(v).toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function formatDate(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString("es-EC");
  } catch {
    return d;
  }
}
// Función para obtener la fecha actual en formato YYYY-MM-DD
function getTodayString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
export default function Dashboard() {
  // filtros
  const [estado, setEstado] = useState("Todos");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState(getTodayString()); // hasta fecha actual por defecto
  const [q, setQ] = useState("");
  // data
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const timer = useRef(null);

  // modal
  const [modal, setModal] = useState(null); // {type, row, jobId, errorMsg, report}
  // checks: NO auto-seleccionar nada
  const [checks, setChecks] = useState({
    interpol: false,
    supercias_persona: false,
    ruc: false,
    google: false,
    contraloria: false,
    mercado_valores: false,
    denuncias: false,
    deudas: false,
    predio_quito: false,
    predio_manta: false,
  });

  // bloquear/desbloquear scroll al abrir/cerrar modal
  useEffect(() => {
    document.body.style.overflow = modal ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [modal]);

  async function refresh() {
    setLoading(true);
    try {
      const data = await listLista({ estado, fechaDesde: desde, fechaHasta: hasta, q });
      setRows(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    timer.current = setInterval(refresh, 3000);
    return () => timer.current && clearInterval(timer.current);
    // eslint-disable-next-line
  }, [estado, desde, hasta, q]);

  const counts = useMemo(() => {
    const base = { Pendiente: 0, Procesando: 0, Procesado: 0, Error: 0 };
    rows.forEach(r => { if (base[r.estado] !== undefined) base[r.estado]++; });
    return base;
  }, [rows]);

  // ---------- Detalles (4 escenarios) ----------
  function openDetalles(row) {
    // reset checks para que el user decida
    setChecks({
      interpol: false,
      supercias_persona: false,
      ruc: false,
      google: false,
      contraloria: false,
      mercado_valores: false,
      denuncias: false,
      deudas: false,
      predio_quito: false,
      predio_manta: false,
    });

    if (row.estado === "Pendiente") {
      setModal({ type: "select", row });
    } else if (row.estado === "Procesando") {
      setModal({ type: "processing", row });
    } else if (row.estado === "Procesado") {
      setModal({ type: "summary", row, report: null });
    } else {
      setModal({ type: "error", row, errorMsg: row.mensaje_error || "Error en el procesamiento" });
    }
  }

  // Construye items para /api/consultas según checks con mapeo exacto
  function buildItemsForRow(row) {
    const items = [];
    const nombre = (row.nombre || "").trim();
    const apellido = (row.apellido || "").trim();
    const fullName = [nombre, apellido].filter(Boolean).join(" ").trim() || [apellido, nombre].filter(Boolean).join(" ").trim();

    // INTERPOL -> SOLO APELLIDO
    if (checks.interpol) {
      if (!apellido) {
        console.warn("INTERPOL omitido: falta apellido.");
      } else {
        items.push({
          tipo: "interpol",
          valor: apellido,        // sólo apellido (como pediste)
          apellidos: apellido,    // redundante para el backend (compatible)
          // nombres: undefined
        });
      }
    }

    // Supercias – Personas (Acciones) -> CI (10)
    if (checks.supercias_persona) {
      if (!/^\d{10}$/.test(row.ci || "")) {
        console.warn("Supercias Persona omitido: CI inválida o ausente.");
      } else {
        items.push({ tipo: "supercias_persona", valor: row.ci });
      }
    }

    // SRI – RUC -> RUC (13)
    if (checks.ruc) {
      if (!/^\d{13}$/.test(row.ruc || "")) {
        console.warn("RUC omitido: RUC inválido o ausente.");
      } else {
        items.push({ tipo: "ruc", valor: row.ruc });
      }
    }

    // Google -> Nombres + Apellidos (full)
    if (checks.google) {
      if (!fullName) {
        console.warn("Google omitido: faltan nombres y apellidos.");
      } else {
        items.push({ tipo: "google", valor: fullName });
      }
    }

    // Contraloría (DDJJ) -> CI (10)
    if (checks.contraloria) {
      if (!/^\d{10}$/.test(row.ci || "")) {
        console.warn("Contraloría omitido: CI inválida o ausente.");
      } else {
        items.push({ tipo: "contraloria", valor: row.ci });
      }
    }

    // Mercado de Valores -> RUC (13)
    if (checks.mercado_valores) {
      if (!/^\d{13}$/.test(row.ruc || "")) {
        console.warn("Mercado de Valores omitido: RUC inválido o ausente.");
      } else {
        items.push({ tipo: "mercado_valores", valor: row.ruc });
      }
    }

    // Denuncias (Fiscalía) -> Nombres + Apellidos
    if (checks.denuncias) {
      if (!fullName) {
        console.warn("Denuncias omitido: faltan nombres y apellidos.");
      } else {
        items.push({ tipo: "denuncias", valor: fullName });
      }
    }

    // Deudas SRI -> CI (10) (aunque el backend soporta RUC, tú pediste CI)
    if (checks.deudas) {
      if (!/^\d{10}$/.test(row.ci || "")) {
        console.warn("Deudas SRI omitido: CI inválida o ausente.");
      } else {
        items.push({ tipo: "deudas", valor: row.ci });
      }
    }

    // Predio Quito -> Apellido + Nombre
    if (checks.predio_quito) {
      const quitoName = [apellido, nombre].filter(Boolean).join(" ").trim();
      if (!quitoName || quitoName.length < 3) {
        console.warn("Predio Quito omitido: faltan Apellido y Nombre.");
      } else {
        items.push({ tipo: "predio_quito", valor: quitoName });
      }
    }

    // Predio Manta -> CI (10)
    if (checks.predio_manta) {
      if (!/^\d{10}$/.test(row.ci || "")) {
        console.warn("Predio Manta omitido: CI inválida o ausente.");
      } else {
        items.push({ tipo: "predio_manta", valor: row.ci });
      }
    }

    return items;
  }

  async function handleAgregarACola(row) {
    try {
      const items = buildItemsForRow(row);
      if (!items.length) {
        alert("Selecciona al menos una página válida (revisa que el registro tenga los datos requeridos).");
        return;
      }

      // Estado -> Procesando
      await updateListaEstado(row.id, { estado: "Procesando" });
      setModal({ type: "processing", row });

      // Disparamos el job real
      const meta = { tipo_alerta: row.tipo || "Alerta", monto_usd: row.monto ?? null, fecha_alerta: row.fecha || null };
      const { job_id } = await createConsultas(items, { headless: false, meta, generate_report: true });

      // Poll hasta que termine y actualizamos estado y modal
      await pollJob(row, job_id);
    } catch (e) {
      console.error(e);
      await updateListaEstado(row.id, { estado: "Error", mensaje_error: String(e.message || e) });
      setModal({ type: "error", row, errorMsg: String(e.message || e) });
      refresh();
    }
  }

  async function pollJob(row, jobId) {
    setModal({ type: "processing", row, jobId });
    let done = false;
    while (!done) {
      const st = await getJobStatus(jobId);
      if (st.status === "done") {
        done = true;
        await updateListaEstado(row.id, { estado: "Procesado" });
        refresh();
        
        // Agregar un pequeño delay antes de buscar el reporte
        await new Promise(r => setTimeout(r, 1000)); // 1 segundo de espera
        
       
                // Agregar un pequeño delay antes de buscar el reporte
        await new Promise(r => setTimeout(r, 1000)); 

        try {
          console.log("=== DEBUG REPORTE ===");
          console.log("Job ID:", jobId);
          
          const rep = await getReportByJob(jobId);
          console.log("Respuesta completa:", rep);
          console.log("¿Rep existe?", !!rep);
          console.log("Rep.id:", rep?.id);
           // AGREGAR ESTAS LÍNEAS
          console.log("Antes de setModal - rep:", rep);
          console.log("Antes de setModal - row:", row);
          
            // CAMBIAR ESTA LÍNEA - crear un objeto completamente nuevo
          setModal(prevModal => ({ 
            type: "summary", 
            row: { ...row }, 
            report: { ...rep } 
          }));
          
          console.log("Modal actualizado");
        } catch (error) {
          console.log("=== ERROR AL BUSCAR REPORTE ===");
          console.log("Error completo:", error);
          console.log("Error message:", error.message);
          
          setModal({ type: "summary", row, report: null });
        }
      } else if (st.status === "error") {
        // ... resto del código igual
      }
    }
  }

  return (
    <div style={styles.wrap}>
      <h1 style={styles.h1}>Sistema de Consultas Automatizadas</h1>

      {/* Filtros */}
      <div style={styles.toolbar}>
        <div>
          <label>Filtrar por Estado:</label>
          <select value={estado} onChange={e => setEstado(e.target.value)} style={styles.select}>
            {ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label>Fecha desde:</label>
          <input type="date" value={desde} onChange={e => setDesde(e.target.value)} style={styles.input} min="2025-09-01" max={getTodayString()} />
        </div>
        <div>
          <label>Fecha hasta:</label>
          <input type="date" value={hasta} onChange={e => setHasta(e.target.value)} style={styles.input}  min="2025-09-01" max={getTodayString()}/>
        </div>
        <div>
          <label>Buscar:</label>
          <input placeholder="Buscar por nombre, apellido, CI, RUC..." value={q} onChange={e => setQ(e.target.value)} style={styles.input} />
        </div>
        <div><button style={styles.button} onClick={refresh}>{loading ? "Actualizando..." : "Actualizar"}</button></div>
      </div>

      {/* Contadores */}
      <div style={styles.counters}>
        <div style={styles.card("#fff8e1")}><div>Pendientes</div><div style={{ fontSize: 28 }}>{counts.Pendiente}</div></div>
        <div style={styles.card("#e0f2fe")}><div>Procesando</div><div style={{ fontSize: 28 }}>{counts.Procesando}</div></div>
        <div style={styles.card("#e8f5e9")}><div>Procesados</div><div style={{ fontSize: 28 }}>{counts.Procesado}</div></div>
        <div style={styles.card("#ffebee")}><div>Errores</div><div style={{ fontSize: 28 }}>{counts.Error}</div></div>
      </div>

      {/* Tabla */}
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Nombre</th>
            <th style={styles.th}>Apellido</th>
            <th style={styles.th}>CI</th>
            <th style={styles.th}>RUC</th>
            <th style={styles.th}>Tipo</th>
            <th style={styles.th}>Monto</th>
            <th style={styles.th}>Fecha</th>
            <th style={styles.th}>Estado</th>
            <th style={styles.th}>Creado</th>
            <th style={styles.th}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id}>
              <td style={styles.td}>{r.nombre}</td>
              <td style={styles.td}>{r.apellido}</td>
              <td style={styles.td}>{r.ci || "—"}</td>
              <td style={styles.td}>{r.ruc || "—"}</td>
              <td style={styles.td}>{r.tipo}</td>
              <td style={styles.td}>{formatMoney(r.monto)}</td>
              <td style={styles.td}>{r.fecha || "—"}</td>
              <td style={styles.td}><EstadoPill estado={r.estado} /></td>
              <td style={styles.td}>{formatDate(r.fecha_creacion)}</td>
              <td style={styles.td}><button style={styles.btnMini} onClick={() => openDetalles(r)}>Detalles</button></td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td style={{ ...styles.td, textAlign: "center" }} colSpan={10}>Sin registros</td></tr>
          )}
        </tbody>
      </table>

      {/* Modales */}
      {modal && (
        <div style={styles.modalBg} onClick={() => setModal(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            {/* Header dinámico */}
            <div style={styles.modalHead}>
              <div>
                {modal.type === "select" && "Seleccionar Páginas a Consultar"}
                {modal.type === "processing" && "Flujo en Proceso"}
                {modal.type === "summary" && "Resumen de Consulta"}
                {modal.type === "error" && "Resumen de Consulta"}
              </div>
              <button onClick={() => setModal(null)} style={{ background: "transparent", color: "#fff", border: 0, fontSize: 24, cursor: "pointer" }}>×</button>
            </div>

            {/* Cuerpo */}
            <div style={styles.modalBody}>
              {/* Pendiente -> selector */}
              {modal.type === "select" && (
                <>
                  <div style={{ background: "#f0f9ff", border: "1px solid #b3e5fc", padding: 16, borderRadius: 8, marginBottom: 20, color: '#0c4a6e', fontSize: '16px', lineHeight: '1.5' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '15px' }}>Registro seleccionado:</div>
                    <div>Nombre: {modal.row.apellido} {modal.row.nombre}</div>
                    <div>CI/RUC: {modal.row.ci || "—"}{modal.row.ruc ? ` / ${modal.row.ruc}` : ""}</div>
                  </div>

                  <div style={{ fontWeight: 700, marginBottom: 16, fontSize: '16px', color: '#111827' }}>Selecciona las páginas que deseas consultar:</div>

                  {/* GRID de tarjetas */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    {[
                      { key: "interpol", title: "INTERPOL - Notificaciones rojas", require: "Usa: Solo APELLIDO" },
                      { key: "supercias_persona", title: "Superintendencia de Compañías - Personas (Acciones)", require: "Usa: CI (10 dígitos)" },
                      { key: "ruc", title: "SRI - Consulta RUC", require: "Usa: RUC (13 dígitos)" },
                      { key: "google", title: "Google - Búsqueda por nombres", require: "Usa: Nombres + Apellidos" },
                      { key: "contraloria", title: "Contraloría - Declaraciones Patrimoniales", require: "Usa: CI (10 dígitos)" },
                      { key: "mercado_valores", title: "Mercado de Valores (Supercias)", require: "Usa: RUC (13 dígitos)" },
                      { key: "denuncias", title: "Fiscalía - Denuncias/Noticias de delito", require: "Usa: Nombres + Apellidos" },
                      { key: "deudas", title: "SRI - Deudas Firmes/Impugnadas/Fac. Pago", require: "Usa: CI (10 dígitos)" },
                      { key: "predio_quito", title: "Predio Quito", require: "Usa: Apellido + Nombre" },
                      { key: "predio_manta", title: "Predio Manta", require: "Usa: CI (10 dígitos)" },
                    ].map(opt => (
                      <div key={opt.key} style={{ border: "2px solid #e5e7eb", borderRadius: 8, padding: 16, backgroundColor: '#fafafa' }}>
                        <label style={{ display: "flex", gap: 12, alignItems: "flex-start", cursor: "pointer", color: "#1f2937" }}>
                          <input
                            type="checkbox"
                            checked={!!checks[opt.key]}
                            onChange={e => setChecks(s => ({ ...s, [opt.key]: e.target.checked }))}
                            style={{ marginTop: 2, transform: "scale(1.1)" }}
                          />
                          <div>
                            <div style={{ fontWeight: 700, color: "#111827", marginBottom: 4, fontSize: 15 }}>{opt.title}</div>
                            <div style={{ color: "#6b7280", fontSize: 12, lineHeight: 1.4 }}>{opt.require}</div>
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Procesando */}
              {modal.type === "processing" && (
                <div style={{ textAlign: "center", padding: "30px 10px" }}>
                  <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: '#111827' }}>
                    Este flujo está siendo procesado en la cola.
                  </div>
                  <div style={{ color: '#4b5563', fontSize: '16px' }}>
                    Por favor espere...
                  </div>
                  {modal.jobId && (
                    <div style={{ marginTop: 12, color: '#6b7280', fontSize: '14px' }}>
                      Job: {modal.jobId}
                    </div>
                  )}
                </div>
              )}

              {/* Resumen – OK */}
              {modal.type === "summary" && (
                <>
                {console.log("RENDERIZANDO SUMMARY - modal.report:", modal.report)}
                  <div style={{ background: '#f0fdf4', border: '2px solid #22c55e', padding: '16px', borderRadius: '8px', marginBottom: '20px', color: '#14532d', fontSize: '14px', lineHeight: '1.5' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '15px' }}>
                      Procesamiento completado exitosamente
                    </div>
                    <div style={{ marginBottom: 4 }}>
                      <strong>Procesado:</strong> {formatDate(Date.now())}
                    </div>
                    <div>
                      <strong>Registro:</strong> {modal.row.apellido} {modal.row.nombre} - {modal.row.ci || "—"}
                    </div>
                  </div>

                  <div style={{ marginTop: 16 }}>
                    {modal.report ? (
                      <a
                        href={downloadReportUrl(modal.report.id)}
                        style={{ ...styles.button, display: "inline-block", textDecoration: "none" }}
                      >
                        📄 Descargar Informe Completo
                      </a>
                    ) : (
                      <div style={{ color: '#6b7280', fontSize: '14px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                        No se encontró el reporte (aún). Puedes verificar en "Gestión de Documentos".
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Resumen – Error */}
              {modal.type === "error" && (
                <div style={{ background: '#fef2f2', border: '2px solid #ef4444', padding: '16px', borderRadius: '8px', color: '#7f1d1d', fontSize: '14px', lineHeight: '1.5' }}>
                  <div style={{ fontWeight: 700, marginBottom: 12, fontSize: '15px' }}>
                    ⚠️ Error en el procesamiento
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <strong>Mensaje:</strong> {modal.errorMsg || "Error desconocido"}
                  </div>
                  <div>
                    <strong>Fecha del error:</strong> {formatDate(Date.now())}
                  </div>
                </div>
              )}
            </div>

            {/* Pie del modal */}
            <div style={styles.modalFoot}>
              {modal.type === "select" && (
                <>
                  <button
                    onClick={() => setModal(null)}
                    style={{ ...styles.button, backgroundColor: '#6b7280' }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleAgregarACola(modal.row)}
                    style={styles.button}
                  >
                    + Agregar a Cola
                  </button>
                </>
              )}
              {modal.type !== "select" && (
                <button
                  onClick={() => setModal(null)}
                  style={{ ...styles.button, backgroundColor: '#6b7280' }}
                >
                  Cerrar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
