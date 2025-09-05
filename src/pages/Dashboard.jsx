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
  modalBg: { 
    position: "fixed", 
    top: 0, 
    left: 0, 
    width: "100%", 
    height: "100%", 
    background: "rgba(0,0,0,0.8)", // Más oscuro para bloquear visualmente
    display: "flex", 
    alignItems: "center", 
    justifyContent: "center", 
    zIndex: 99999, // Más alto para estar encima de todo
    backdropFilter: "blur(2px)", // Desenfoque del fondo
  },
  modal: { width: 720, maxWidth: "95vw", background: "#fff", borderRadius: 8, overflow: "hidden", boxShadow: "0 14px 40px rgba(0,0,0,.25)" },
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

export default function Dashboard() {
  // filtros
  const [estado, setEstado] = useState("Todos");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [q, setQ] = useState("");
  // data
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const timer = useRef(null);

  // modal
  const [modal, setModal] = useState(null); // {type, row, jobId, errorMsg, report}
  const [checks, setChecks] = useState({ interpol: true, supercias: true, ruc: true });

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
    // Bloquear scroll del body
    document.body.style.overflow = 'hidden';
    
    if (row.estado === "Pendiente") {
      setChecks({ interpol: true, supercias: true, ruc: true });
      setModal({ type: "select", row });
    } else if (row.estado === "Procesando") {
      setModal({ type: "processing", row });
      // empezamos a poller por si ya existe job guardado externamente
    } else if (row.estado === "Procesado") {
      setModal({ type: "summary", row, report: null });
    } else {
      setModal({ type: "error", row, errorMsg: row.mensaje_error || "Error en el procesamiento" });
    }
  }

  // Construye items para /api/consultas según checks
  function buildItemsForRow(row) {
    const items = [];
    const fullName = `${row.apellido || ""} ${row.nombre || ""}`.trim();

    if (checks.interpol) {
      items.push({
        tipo: "interpol",
        valor: row.apellido || row.nombre || fullName || "N",
        apellidos: row.apellido || undefined,
        nombres: row.nombre || undefined,
      });
    }
    if (checks.supercias && row.ci && /^\d{10}$/.test(row.ci)) {
      items.push({ tipo: "supercias_persona", valor: row.ci });
    }
    if (checks.ruc && row.ruc && /^\d{13}$/.test(row.ruc)) {
      items.push({ tipo: "ruc", valor: row.ruc });
    }
    return items;
  }

  async function handleAgregarACola(row) {
    try {
      const items = buildItemsForRow(row);
      if (!items.length) {
        alert("Selecciona al menos una página (y asegúrate de que el registro tiene CI/RUC válidos).");
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
      // eslint-disable-next-line no-await-in-loop
      const st = await getJobStatus(jobId);
      if (st.status === "done") {
        done = true;
        await updateListaEstado(row.id, { estado: "Procesado" });
        refresh();
        // intenta localizar el reporte
        try {
          const rep = await getReportByJob(jobId);
          setModal({ type: "summary", row, report: rep });
        } catch {
          setModal({ type: "summary", row, report: null });
        }
      } else if (st.status === "error") {
        done = true;
        await updateListaEstado(row.id, { estado: "Error", mensaje_error: st.error || "Fallo en job" });
        refresh();
        setModal({ type: "error", row, errorMsg: st.error || "Error en el procesamiento" });
      } else {
        // eslint-disable-next-line no-await-in-loop
        await new Promise(r => setTimeout(r, 2500));
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
          <input type="date" value={desde} onChange={e => setDesde(e.target.value)} style={styles.input} />
        </div>
        <div>
          <label>Fecha hasta:</label>
          <input type="date" value={hasta} onChange={e => setHasta(e.target.value)} style={styles.input} />
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
                    <div>CI/RUC: {modal.row.ci || "—"} {modal.row.ruc ? ` / ${modal.row.ruc}` : ""}</div>
                  </div>

                  <div style={{ fontWeight: 700, marginBottom: 16, fontSize: '16px', color: '#111827' }}>Selecciona las páginas que deseas consultar:</div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, '@media (max-width: 640px)': { gridTemplateColumns: '1fr' } }}>
                    <div style={{ border: "2px solid #e5e7eb", borderRadius: 8, padding: 16, backgroundColor: '#fafafa', transition: 'border-color 0.2s ease' }}>
                      <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <input type="checkbox" checked={checks.interpol} onChange={e => setChecks(s => ({ ...s, interpol: e.target.checked }))} />
                        <div>
                          <div style={{
                            fontWeight: '700',
                            color: '#111827',
                            marginBottom: '4px',
                            fontSize: '15px'
                          }}>
                            INTERPOL - Notificaciones rojas
                          </div>
                          <div style={{
                            color: '#6b7280',
                            fontSize: '12px',
                            lineHeight: '1.4'
                          }}>
                            Requiere: nombres, apellidos
                          </div>
                        </div>
                      </label>
                    </div>

                    <div style={{
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '16px',
                      backgroundColor: '#fafafa',
                      transition: 'border-color 0.2s ease'
                    }}>
                      <label style={{
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'flex-start',
                        cursor: 'pointer',
                        color: '#1f2937',
                        fontSize: '14px',
                        lineHeight: '1.5'
                      }}>
                        <input
                          type="checkbox"
                          checked={checks.supercias}
                          onChange={e => setChecks(s => ({ ...s, supercias: e.target.checked }))}
                          style={{ marginTop: '2px', transform: 'scale(1.1)' }}
                        />
                        <div>
                          <div style={{
                            fontWeight: '700',
                            color: '#111827',
                            marginBottom: '4px',
                            fontSize: '15px'
                          }}>
                            Superintendencia de Compañías - Personas
                          </div>
                          <div style={{
                            color: '#6b7280',
                            fontSize: '12px',
                            lineHeight: '1.4'
                          }}>
                            Requiere: CI (10 dígitos)
                          </div>
                        </div>
                      </label>
                    </div>

                    {/* Opción SRI */}
                    <div style={{
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '16px',
                      backgroundColor: '#fafafa',
                      transition: 'border-color 0.2s ease'
                    }}>
                      <label style={{
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'flex-start',
                        cursor: 'pointer',
                        color: '#1f2937',
                        fontSize: '14px',
                        lineHeight: '1.5'
                      }}>
                        <input
                          type="checkbox"
                          checked={checks.ruc}
                          onChange={e => setChecks(s => ({ ...s, ruc: e.target.checked }))}
                          style={{ marginTop: '2px', transform: 'scale(1.1)' }}
                        />
                        <div>
                          <div style={{
                            fontWeight: '700',
                            color: '#111827',
                            marginBottom: '4px',
                            fontSize: '15px'
                          }}>
                            SRI - Consulta RUC
                          </div>
                          <div style={{
                            color: '#6b7280',
                            fontSize: '12px',
                            lineHeight: '1.4'
                          }}>
                            Requiere: RUC (13 dígitos)
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                </>
              )}

              {/* Procesando */}
              {modal.type === "processing" && (
                <div style={{ textAlign: "center", padding: "30px 10px" }}>
                  <div style={{
                    fontSize: 18,
                    fontWeight: 700,
                    marginBottom: 12,
                    color: '#111827'
                  }}>
                    Este flujo está siendo procesado en la cola.
                  </div>
                  <div style={{ color: '#4b5563', fontSize: '16px' }}>
                    Por favor espere...
                  </div>
                  {modal.jobId && (
                    <div style={{
                      marginTop: 12,
                      color: '#6b7280',
                      fontSize: '14px'
                    }}>
                      Job: {modal.jobId}
                    </div>
                  )}
                </div>
              )}

              {/* Resumen – OK */}
              {modal.type === "summary" && (
                <>
                  <div style={{
                    background: '#f0fdf4',
                    border: '2px solid #22c55e',
                    padding: '16px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    color: '#14532d',
                    fontSize: '14px',
                    lineHeight: '1.5'
                  }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '15px' }}>
                      Procesamiento completado exitosamente
                    </div>
                    <div style={{ marginBottom: '4px' }}>
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
                        style={{
                          ...styles.button,
                          display: "inline-block",
                          textDecoration: "none"
                        }}
                      >
                        📄 Descargar Informe Completo
                      </a>
                    ) : (
                      <div style={{
                        color: '#6b7280',
                        fontSize: '14px',
                        padding: '12px',
                        backgroundColor: '#f9fafb',
                        borderRadius: '6px',
                        border: '1px solid #e5e7eb'
                      }}>
                        No se encontró el reporte (aún). Puedes verificar en "Gestión de Documentos".
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Resumen – Error */}
              {modal.type === "error" && (
                <div style={{
                  background: '#fef2f2',
                  border: '2px solid #ef4444',
                  padding: '16px',
                  borderRadius: '8px',
                  color: '#7f1d1d',
                  fontSize: '14px',
                  lineHeight: '1.5'
                }}>
                  <div style={{
                    fontWeight: 700,
                    marginBottom: 12,
                    fontSize: '15px'
                  }}>
                    ⚠️ Error en el procesamiento
                  </div>
                  <div style={{ marginBottom: '8px' }}>
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
                    style={{
                      ...styles.button,
                      backgroundColor: '#6b7280'
                    }}
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
                  style={{
                    ...styles.button,
                    backgroundColor: '#6b7280'
                  }}
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
