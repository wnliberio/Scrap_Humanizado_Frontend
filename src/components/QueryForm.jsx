// src/components/QueryForm.jsx
import { useEffect, useRef, useState } from "react";
import { createConsultas, getJobStatus, listReports, downloadReportUrl } from "../lib/api";

export default function QueryForm() {
  const [rucChecked, setRucChecked] = useState(false);
  const [deudasChecked, setDeudasChecked] = useState(false);
  const [denunciasChecked, setDenunciasChecked] = useState(false);
  const [mvChecked, setMvChecked] = useState(false);
  const [interpolChecked, setInterpolChecked] = useState(false);
  const [googleChecked, setGoogleChecked] = useState(false);
  const [contraloriaChecked, setContraloriaChecked] = useState(false);

  // NUEVO: Supercias Persona
  const [spChecked, setSpChecked] = useState(false);
  const [spValue, setSpValue] = useState("");

  // NUEVO: Predios (submenú y campos)
  const [prediosOpen, setPrediosOpen] = useState(false);
  const [predioQuitoChecked, setPredioQuitoChecked] = useState(false);
  const [predioMantaChecked, setPredioMantaChecked] = useState(false);
  const [predioQuitoNombres, setPredioQuitoNombres] = useState("");
  const [predioMantaValor, setPredioMantaValor] = useState("");

  const [rucValue, setRucValue] = useState("");
  const [deudasValue, setDeudasValue] = useState("");
  const [denunciasValue, setDenunciasValue] = useState("");
  const [mvValue, setMvValue] = useState("");

  // INTERPOL
  const [interpolApellidos, setInterpolApellidos] = useState("");
  const [interpolNombres, setInterpolNombres] = useState("");

  // GOOGLE
  const [googleQuery, setGoogleQuery] = useState("");

  // CONTRALORÍA
  const [contraloriaCedula, setContraloriaCedula] = useState("");

  const [headless, setHeadless] = useState(false);

  const [jobId, setJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  const [resultData, setResultData] = useState(null);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // NUEVO: meta-informe
  const [tipoAlerta, setTipoAlerta] = useState("");
  const [montoUsd, setMontoUsd] = useState("");
  const [fechaAlerta, setFechaAlerta] = useState("");
  const [generateReport, setGenerateReport] = useState(true);

  // NUEVO (Panel de reportes)
  const [reportsOpen, setReportsOpen] = useState(false);
  const [repDesde, setRepDesde] = useState("");
  const [repHasta, setRepHasta] = useState("");
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [repError, setRepError] = useState(null);

  const pollRef = useRef(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  function buildItems() {
    const items = [];

    if (rucChecked) {
      if (!rucValue.trim()) throw new Error("Ingresa el RUC para la consulta RUC.");
      items.push({ tipo: "ruc", valor: rucValue.trim() });
    }

    if (deudasChecked) {
      const v = (deudasValue || (rucChecked ? rucValue : "")).trim();
      if (!v) throw new Error("Ingresa cédula/RUC para la consulta de Deudas.");
      items.push({ tipo: "deudas", valor: v });
    }

    if (denunciasChecked) {
      const nombre = denunciasValue.trim();
      if (!nombre) throw new Error("Ingresa los nombres completos para la consulta de Denuncias.");
      items.push({ tipo: "denuncias", valor: nombre });
    }

    if (mvChecked) {
      const q = mvValue.trim();
      if (!q) throw new Error("Ingresa identificación o nombre para Mercado de Valores.");
      if (/^\d+$/.test(q) && q.length !== 13) {
        throw new Error("Para Mercado de Valores: si ingresas solo dígitos, el RUC debe tener 13 dígitos.");
      }
      items.push({ tipo: "mercado_valores", valor: q });
    }

    if (interpolChecked) {
      const ap = interpolApellidos.trim();
      const no = interpolNombres.trim();
      if (!ap && !no) {
        throw new Error("INTERPOL: ingresa Apellidos o Nombres (al menos uno).");
      }
      const valor = ap || no;
      items.push({
        tipo: "interpol",
        valor,
        apellidos: ap || undefined,
        nombres: no || undefined,
      });
    }

    if (googleChecked) {
      const q = googleQuery.trim();
      if (q.length < 2) throw new Error("Google: ingresa al menos 2 caracteres para la búsqueda.");
      items.push({ tipo: "google", valor: q });
    }

    if (contraloriaChecked) {
      const c = contraloriaCedula.trim();
      if (!/^\d{10}$/.test(c)) {
        throw new Error("Contraloría: la cédula debe tener exactamente 10 dígitos.");
      }
      items.push({ tipo: "contraloria", valor: c });
    }

    // EXISTENTE: Supercias – Persona (auto: 10 dígitos = Identificación, si no Nombre)
    if (spChecked) {
      const v = spValue.trim();
      if (!v) throw new Error("Supercias Persona: ingresa Cédula (10 dígitos) o Nombre.");
      if (/^\d+$/.test(v) && v.length !== 10) {
        throw new Error("Supercias Persona: si ingresas solo dígitos, la cédula debe tener 10 dígitos.");
      }
      items.push({ tipo: "supercias_persona", valor: v });
    }

    // NUEVO: Predio Quito
    if (predioQuitoChecked) {
      const qn = predioQuitoNombres.trim();
      if (qn.length < 3) throw new Error("Predio Quito: ingresa Apellidos y Nombres.");
      items.push({ tipo: "predio_quito", valor: qn });
    }

    // NUEVO: Predio Manta
    if (predioMantaChecked) {
      const vm = predioMantaValor.trim();
      if (!vm) throw new Error("Predio Manta: ingresa Cédula/RUC/Pasaporte o Apellidos/Nombres.");

      const isCedula = /^\d{10}$/.test(vm);
      const isRuc = /^\d{13}$/.test(vm);
      const isPassport = /^[A-Za-z]{3}\d{6}$/.test(vm);
      const isName =
        /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/.test(vm) && vm.replace(/\s+/g, " ").trim().length >= 3;

      if (!(isCedula || isRuc || isPassport || isName)) {
        throw new Error(
          "Predio Manta: usa Cédula (10), RUC (13), Pasaporte (AAA999999) o Apellidos/Nombres."
        );
      }
      items.push({ tipo: "predio_manta", valor: vm });
    }

    if (items.length === 0) throw new Error("Selecciona al menos una página a consultar.");
    return items;
  }

  function validateMeta() {
    // Tipo de alerta opcional, pero si envías monto/fecha, validamos ligerito
    if (montoUsd && Number(montoUsd) < 0) {
      throw new Error("El monto debe ser cero o positivo.");
    }
    if (fechaAlerta) {
      const d = new Date(fechaAlerta);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (d > today) {
        throw new Error("La fecha de alerta no puede ser posterior a hoy.");
      }
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setResultData(null);
    setJobId(null);
    setJobStatus(null);
    if (pollRef.current) clearInterval(pollRef.current);

    let items;
    try {
      items = buildItems();
      validateMeta();
    } catch (err) {
      setError(err.message);
      return;
    }

    try {
      setIsSubmitting(true);
      const resp = await createConsultas(items, {
        headless,
        meta: {
          tipo_alerta: tipoAlerta.trim(),
          monto_usd: montoUsd ? Number(montoUsd) : null,
          fecha_alerta: fechaAlerta || null,
        },
        generate_report: generateReport,
      });
      setJobId(resp.job_id);
      setJobStatus(resp.status ?? "queued");

      pollRef.current = setInterval(async () => {
        try {
          const st = await getJobStatus(resp.job_id);
          setJobStatus(st.status);
          if (st.status === "done") {
            setResultData(st.data || {});
            clearInterval(pollRef.current);
            pollRef.current = null;
            setIsSubmitting(false);
          } else if (st.status === "error") {
            setError(st.error || "Error en el job");
            clearInterval(pollRef.current);
            pollRef.current = null;
            setIsSubmitting(false);
          }
        } catch (err) {
          setError(err.message || "Failed to fetch");
          clearInterval(pollRef.current);
          pollRef.current = null;
          setIsSubmitting(false);
        }
      }, 3000);
    } catch (err) {
      setError(err.message || "Failed to fetch");
      setIsSubmitting(false);
    }
  }

  function resetAll() {
    setRucChecked(false);
    setDeudasChecked(false);
    setDenunciasChecked(false);
    setMvChecked(false);
    setInterpolChecked(false);
    setGoogleChecked(false);
    setContraloriaChecked(false);
    setSpChecked(false);

    // NUEVO: predios
    setPrediosOpen(false);
    setPredioQuitoChecked(false);
    setPredioMantaChecked(false);
    setPredioQuitoNombres("");
    setPredioMantaValor("");

    setRucValue("");
    setDeudasValue("");
    setDenunciasValue("");
    setMvValue("");
    setInterpolApellidos("");
    setInterpolNombres("");
    setGoogleQuery("");
    setContraloriaCedula("");
    setSpValue("");

    // NUEVO: meta
    setTipoAlerta("");
    setMontoUsd("");
    setFechaAlerta("");
    setGenerateReport(true);

    setHeadless(false);
    setJobId(null);
    setJobStatus(null);
    setResultData(null);
    setError(null);
    if (pollRef.current) clearInterval(pollRef.current);
  }

  // --- Reports panel helpers ---
  async function fetchReports() {
    setRepError(null);
    setLoadingReports(true);
    try {
      const data = await listReports({ fechaDesde: repDesde || undefined, fechaHasta: repHasta || undefined, onlyDocx: true });
      setReports(data);
    } catch (e) {
      setRepError(e.message || "Error al listar reportes");
    } finally {
      setLoadingReports(false);
    }
  }

  useEffect(() => {
    if (reportsOpen) fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportsOpen]);

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 16 }}>
      <h2>Criterios de Consulta</h2>

      <form onSubmit={handleSubmit} style={{ marginTop: 12, border: "1px solid #ddd", borderRadius: 8, padding: 16 }}>
        {/* === META-INFORME (NUEVO) === */}
        <div style={{ padding: 12, marginBottom: 12, background: "#9f3d3dff", borderRadius: 8, border: "1px dashed #ccc" }}>
          <h3 style={{ marginBottom: 8 }}>Datos del Informe</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 160px 160px", gap: 8 }}>
            <input
              type="text"
              placeholder="Tipo de Alerta (p. ej.: Venta vehículo, Venta casa, etc.)"
              value={tipoAlerta}
              onChange={(e) => setTipoAlerta(e.target.value)}
              disabled={isSubmitting}
              style={{ width: "100%", padding: 8 }}
            />
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Monto (USD)"
              value={montoUsd}
              onChange={(e) => setMontoUsd(e.target.value)}
              disabled={isSubmitting}
              style={{ width: "100%", padding: 8 }}
            />
            <input
              type="date"
              value={fechaAlerta}
              max={todayStr}
              onChange={(e) => setFechaAlerta(e.target.value)}
              disabled={isSubmitting}
              style={{ width: "100%", padding: 8 }}
            />
          </div>
          <label style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 8 }}>
            <input
              type="checkbox"
              checked={generateReport}
              onChange={(e) => setGenerateReport(e.target.checked)}
              disabled={isSubmitting}
            />
            <span>Generar Informe (.docx) al terminar</span>
          </label>
        </div>

        {/* RUC */}
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input type="checkbox" checked={rucChecked} onChange={(e) => setRucChecked(e.target.checked)} disabled={isSubmitting} />
          <strong>RUC (SRI)</strong>
        </label>
        {rucChecked && (
          <div style={{ margin: "8px 0 16px 24px" }}>
            <input type="text" placeholder="RUC" value={rucValue} onChange={(e) => setRucValue(e.target.value)} disabled={isSubmitting} style={{ width: "100%", padding: 8 }} />
            <small style={{ color: "#666" }}>Ej.: 1800587626001</small>
          </div>
        )}

        {/* Deudas */}
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input type="checkbox" checked={deudasChecked} onChange={(e) => setDeudasChecked(e.target.checked)} disabled={isSubmitting} />
          <strong>Deudas Firmes/Impugnadas/Facilidades de Pago (SRI)</strong>
        </label>
        {deudasChecked && (
          <div style={{ margin: "8px 0 16px 24px" }}>
            <input type="text" placeholder="Cédula / RUC" value={deudasValue} onChange={(e) => setDeudasValue(e.target.value)} disabled={isSubmitting} style={{ width: "100%", padding: 8 }} />
            <small style={{ color: "#666" }}>Si lo dejas vacío y marcaste RUC, se reutiliza ese valor.</small>
          </div>
        )}

        {/* Denuncias */}
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input type="checkbox" checked={denunciasChecked} onChange={(e) => setDenunciasChecked(e.target.checked)} disabled={isSubmitting} />
          <strong>Denuncias o Noticias de Delito (Fiscalía)</strong>
        </label>
        {denunciasChecked && (
          <div style={{ margin: "8px 0 16px 24px" }}>
            <input type="text" placeholder="Nombres completos (Nombres Apellidos)" value={denunciasValue} onChange={(e) => setDenunciasValue(e.target.value)} disabled={isSubmitting} style={{ width: "100%", padding: 8 }} />
            <small style={{ color: "#666" }}>Requerido: ingresa los nombres completos.</small>
          </div>
        )}

        {/* Mercado de Valores */}
        <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
          <input type="checkbox" checked={mvChecked} onChange={(e) => setMvChecked(e.target.checked)} disabled={isSubmitting} />
          <strong>Mercado de Valores (Supercias)</strong>
        </label>
        {mvChecked && (
          <div style={{ margin: "8px 0 16px 24px" }}>
            <input type="text" placeholder="RUC / Nombre de la entidad" value={mvValue} onChange={(e) => setMvValue(e.target.value)} disabled={isSubmitting} style={{ width: "100%", padding: 8 }} />
            <small style={{ color: "#666" }}>Detección automática: si ingresas solo dígitos, debe ser RUC de 13 dígitos; caso contrario se tomará como nombre.</small>
          </div>
        )}

        {/* INTERPOL */}
        <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
          <input type="checkbox" checked={interpolChecked} onChange={(e) => setInterpolChecked(e.target.checked)} disabled={isSubmitting} />
          <strong>Notificaciones rojas (Interpol)</strong>
        </label>
        {interpolChecked && (
          <div style={{ margin: "8px 0 16px 24px" }}>
            <div style={{ display: "grid", gap: 8 }}>
              <input type="text" placeholder="Apellidos (opcional si llenas Nombres)" value={interpolApellidos} onChange={(e) => setInterpolApellidos(e.target.value)} disabled={isSubmitting} style={{ width: "100%", padding: 8 }} />
              <input type="text" placeholder="Nombres (opcional si llenas Apellidos)" value={interpolNombres} onChange={(e) => setInterpolNombres(e.target.value)} disabled={isSubmitting} style={{ width: "100%", padding: 8 }} />
            </div>
            <small style={{ color: "#666" }}>Puedes llenar solo Apellidos, solo Nombres, o ambos.</small>
          </div>
        )}

        {/* GOOGLE */}
        <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
          <input type="checkbox" checked={googleChecked} onChange={(e) => setGoogleChecked(e.target.checked)} disabled={isSubmitting} />
          <strong>Google (Búsqueda simple)</strong>
        </label>
        {googleChecked && (
          <div style={{ margin: "8px 0 16px 24px" }}>
            <input type="text" placeholder='Texto a buscar (p. ej.: "VELA VASCO MARCO ANTONIO")' value={googleQuery} onChange={(e) => setGoogleQuery(e.target.value)} disabled={isSubmitting} style={{ width: "100%", padding: 8 }} />
            <small style={{ color: "#666" }}>Se realiza una consulta en Internet por nombres </small>
          </div>
        )}

        {/* CONTRALORÍA – DDJJ */}
        <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
          <input
            type="checkbox"
            checked={contraloriaChecked}
            onChange={(e) => setContraloriaChecked(e.target.checked)}
            disabled={isSubmitting}
          />
          <strong>Declaraciones Patrimoniales Juradas (Contraloría)</strong>
        </label>
        {contraloriaChecked && (
          <div style={{ margin: "8px 0 16px 24px" }}>
            <input
              type="text"
              placeholder="Cédula"
              value={contraloriaCedula}
              onChange={(e) => setContraloriaCedula(e.target.value)}
              disabled={isSubmitting}
              style={{ width: "100%", padding: 8 }}
            />
            <small style={{ color: "#666" }}>
              Consulta de declaración patrimonial por cédula del cliente
            </small>
          </div>
        )}

        {/* EXISTENTE: Supercias – Consulta de Persona */}
        <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
          <input
            type="checkbox"
            checked={spChecked}
            onChange={(e) => setSpChecked(e.target.checked)}
            disabled={isSubmitting}
          />
          <strong>Acciones (Supercias)</strong>
        </label>
        {spChecked && (
          <div style={{ margin: "8px 0 16px 24px" }}>
            <input
              type="text"
              placeholder="Cédula / Nombres"
              value={spValue}
              onChange={(e) => setSpValue(e.target.value)}
              disabled={isSubmitting}
              style={{ width: "100%", padding: 8 }}
            />
            <small style={{ color: "#666" }}>
              Consulta de acciones por cédula del cliente o nombres.
            </small>
          </div>
        )}

        {/* ============= NUEVA SECCIÓN: Consulta de Predios ============= */}
        <div style={{ marginTop: 16, borderTop: "1px dashed #ddd", paddingTop: 12 }}>
          <button
            type="button"
            onClick={() => setPrediosOpen((v) => !v)}
            disabled={isSubmitting}
            style={{ background: "transparent", border: "none", cursor: "pointer", padding: 0, color: "#0b74de", fontWeight: 600 }}
          >
            {prediosOpen ? "▼" : "►"} Consulta de Predios
          </button>

          {prediosOpen && (
            <div style={{ marginTop: 8 }}>
              {/* Predio Quito */}
              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  checked={predioQuitoChecked}
                  onChange={(e) => setPredioQuitoChecked(e.target.checked)}
                  disabled={isSubmitting}
                />
                <strong>Predio Quito</strong>
              </label>
              {predioQuitoChecked && (
                <div style={{ margin: "8px 0 16px 24px" }}>
                  <input
                    type="text"
                    placeholder='Apellidos y Nombres (p. ej.: "VELA VASCO MARCO ANTONIO")'
                    value={predioQuitoNombres}
                    onChange={(e) => setPredioQuitoNombres(e.target.value)}
                    disabled={isSubmitting}
                    style={{ width: "100%", padding: 8 }}
                  />
                  <small style={{ color: "#666" }}>
                    Consulta de predios en Quito por Apellidos y Nombres.
                  </small>
                </div>
              )}

              {/* Predio Manta */}
              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  checked={predioMantaChecked}
                  onChange={(e) => setPredioMantaChecked(e.target.checked)}
                  disabled={isSubmitting}
                />
                <strong>Predio Manta</strong>
              </label>
              {predioMantaChecked && (
                <div style={{ margin: "8px 0 16px 24px" }}>
                  <input
                    type="text"
                    placeholder='Cédula / RUC, Pasaporte (AAA999999) o Apellidos/Nombres'
                    value={predioMantaValor}
                    onChange={(e) => setPredioMantaValor(e.target.value)}
                    disabled={isSubmitting}
                    style={{ width: "100%", padding: 8 }}
                  />
                  <small style={{ color: "#666" }}>
                    Consulta de predios en Manta por Cédula, RUC, Pasaporte o Apellidos y Nombres.
                  </small>
                </div>
              )}
            </div>
          )}
        </div>
        {/* ============================================================= */}

        <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="submit" disabled={isSubmitting} style={{ padding: "8px 16px" }}>
            {isSubmitting ? "Procesando..." : "Consultar"}
          </button>
          <button type="button" onClick={resetAll} disabled={isSubmitting} style={{ padding: "8px 16px" }}>
            Limpiar
          </button>
          <label style={{ display: "inline-flex", alignItems: "center", gap: 6, marginLeft: "auto" }}>
            <input type="checkbox" checked={headless} onChange={(e) => setHeadless(e.target.checked)} disabled={isSubmitting} />
            <span>Headless</span>
          </label>
        </div>
      </form>

      <div style={{ marginTop: 16 }}>
        {jobId && (
          <div style={{ padding: 12, background: "#f7f7f7", borderRadius: 8 }}>
            <div><strong>Job ID:</strong> {jobId}</div>
            <div><strong>Estado:</strong> {jobStatus || "–"}</div>
          </div>
        )}
        {error && (
          <div style={{ marginTop: 12, padding: 12, background: "#fee", border: "1px solid #fbb", borderRadius: 8, color: "#900" }}>
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>

      {resultData && (
        <div style={{ marginTop: 16, padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
          <h3>Resultado</h3>
          <ul>
            {Object.entries(resultData).map(([tipo, payload]) => (
              <li key={tipo} style={{ marginBottom: 8 }}>
                <strong>{tipo}:</strong>{" "}
                {payload?.screenshot_path ? (
                  <span>
                    {payload.screenshot_path}
                    {/* Si hay una segunda captura (historial), la mostramos también */}
                    {payload?.screenshot_historial_path && (
                      <div style={{ marginTop: 4 }}>
                        <em>Historial:</em> {payload.screenshot_historial_path}
                      </div>
                    )}
                    {payload?.scenario && (
                      <div style={{ marginTop: 4, color: "#666" }}>
                        <small>Escenario: {payload.scenario}</small>
                      </div>
                    )}
                  </span>
                ) : payload?.error ? (
                  <em>{payload.error}</em>
                ) : (
                  <em>Sin datos o falló la captura.</em>
                )}
              </li>
            ))}
          </ul>
          <small style={{ color: "#666" }}>
            (Mostramos solo la ruta de la(s) captura(s); más adelante lo uniremos en un .docx.)
          </small>
        </div>
      )}

      {/* ===== Panel Reportes guardados (usa los endpoints existentes) ===== */}
      <div style={{ marginTop: 24, borderTop: "1px solid #eee", paddingTop: 12 }}>
        <button
          type="button"
          onClick={() => setReportsOpen(v => !v)}
          style={{ background: "transparent", border: "none", color: "#0b74de", fontWeight: 600, cursor: "pointer" }}
        >
          {reportsOpen ? "▼" : "►"} Reportes guardados
        </button>

        {reportsOpen && (
          <div style={{ marginTop: 12, background: "#40b8acff", border: "1px solid #eee", borderRadius: 8, padding: 12 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <label>Desde:</label>
              <input type="date" value={repDesde} max={todayStr} onChange={(e) => setRepDesde(e.target.value)} />
              <label>Hasta:</label>
              <input type="date" value={repHasta} max={todayStr} onChange={(e) => setRepHasta(e.target.value)} />
              <button type="button" onClick={fetchReports} disabled={loadingReports}>Filtrar</button>
              <button type="button" onClick={() => { setRepDesde(""); setRepHasta(""); fetchReports(); }} disabled={loadingReports}>Limpiar</button>
            </div>

            {repError && (
              <div style={{ marginTop: 12, padding: 10, border: "1px solid #fbb", background: "rgba(245, 248, 248, 1)", borderRadius: 6, color: "#900" }}>
                {repError}
              </div>
            )}

            <div style={{ marginTop: 12, overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ background: "#656c8aff" }}>
                  <tr>
                    <th style={{ textAlign: "left", padding: 8 }}>Acción</th>
                    <th style={{ textAlign: "left", padding: 8 }}>Tipo</th>
                    <th style={{ textAlign: "left", padding: 8 }}>Monto</th>
                    <th style={{ textAlign: "left", padding: 8 }}>Fecha Alerta</th>
                    <th style={{ textAlign: "left", padding: 8 }}>Creado</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingReports ? (
                    <tr><td colSpan={5} style={{ padding: 12 }}>Cargando…</td></tr>
                  ) : reports.length === 0 ? (
                    <tr><td colSpan={5} style={{ padding: 12 }}>Sin resultados</td></tr>
                  ) : (
                    reports.map(r => (
                      <tr key={r.id} style={{ borderTop: "1px solid #eaf3f4ff" }}>
                        <td style={{ padding: 8 }}>
                          <a href={downloadReportUrl(r.id)} target="_blank" rel="noreferrer">📥 Descargar</a>
                        </td>
                        <td style={{ padding: 8 }}>{r.tipo_alerta || "—"}</td>
                        <td style={{ padding: 8 }}>
                          {typeof r.monto_usd === "number" ? `$${r.monto_usd.toLocaleString("es-EC")}` : "—"}
                        </td>
                        <td style={{ padding: 8 }}>{r.fecha_alerta || "—"}</td>
                        <td style={{ padding: 8 }}>{r.created_at}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      {/* ================================================================== */}
    </div>
  );
}
