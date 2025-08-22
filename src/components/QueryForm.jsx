// Formulario con checkboxes (RUC / Deudas) y polling
// src/components/QueryForm.jsx
import { useEffect, useRef, useState } from "react";
import { createConsultas, getJobStatus } from "../lib/api";

export default function QueryForm() {
  const [rucChecked, setRucChecked] = useState(true);
  const [deudasChecked, setDeudasChecked] = useState(false);
  const [denunciasChecked, setDenunciasChecked] = useState(false);

  const [rucValue, setRucValue] = useState("");
  const [deudasValue, setDeudasValue] = useState("");
  const [denunciasValue, setDenunciasValue] = useState("");

  const [headless, setHeadless] = useState(false); // normalmente FALSE por captcha

  const [jobId, setJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null); // queued | running | done | error
  const [resultData, setResultData] = useState(null);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      // si no llenan un valor específico para Deudas, usamos el del RUC si está marcado
      const v = (deudasValue || (rucChecked ? rucValue : "")).trim();
      if (!v) throw new Error("Ingresa cédula/RUC para la consulta de Deudas.");
      items.push({ tipo: "deudas", valor: v });
    }

    if (denunciasChecked) {
      const nombre = denunciasValue.trim();
      if (!nombre) throw new Error("Ingresa los nombres completos para la consulta de Denuncias.");
      items.push({ tipo: "denuncias", valor: nombre });
    }

    if (items.length === 0) throw new Error("Selecciona al menos una página a consultar.");
    return items;
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
    } catch (err) {
      setError(err.message);
      return;
    }

    try {
      setIsSubmitting(true);
      const resp = await createConsultas(items, { headless });
      setJobId(resp.job_id);
      setJobStatus(resp.status ?? "queued");

      // Polling cada 3s
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
          setError(err.message);
          clearInterval(pollRef.current);
          pollRef.current = null;
          setIsSubmitting(false);
        }
      }, 3000);
    } catch (err) {
      setError(err.message);
      setIsSubmitting(false);
    }
  }

  function resetAll() {
    setRucChecked(true);
    setDeudasChecked(false);
    setDenunciasChecked(false);
    setRucValue("");
    setDeudasValue("");
    setDenunciasValue("");
    setHeadless(false);
    setJobId(null);
    setJobStatus(null);
    setResultData(null);
    setError(null);
    if (pollRef.current) clearInterval(pollRef.current);
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 16 }}>
      <h2>Consultas públicas</h2>
      <p style={{ marginTop: 4, color: "#666" }}>
        Marca las páginas, ingresa los datos requeridos y presiona “Consultar”.
        El backend ejecuta cada página en secuencia y al final verás las rutas de las capturas.
      </p>

      <form onSubmit={handleSubmit} style={{ marginTop: 12, border: "1px solid #ddd", borderRadius: 8, padding: 16 }}>
        {/* RUC */}
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            checked={rucChecked}
            onChange={(e) => setRucChecked(e.target.checked)}
            disabled={isSubmitting}
          />
          <strong>Consulta RUC (SRI)</strong>
        </label>
        {rucChecked && (
          <div style={{ margin: "8px 0 16px 24px" }}>
            <input
              type="text"
              placeholder="RUC (13 dígitos)"
              value={rucValue}
              onChange={(e) => setRucValue(e.target.value)}
              disabled={isSubmitting}
              style={{ width: "100%", padding: 8 }}
            />
            <small style={{ color: "#666" }}>Ej.: 2300531528001</small>
          </div>
        )}

        {/* Deudas */}
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            checked={deudasChecked}
            onChange={(e) => setDeudasChecked(e.target.checked)}
            disabled={isSubmitting}
          />
          <strong>Deudas firmes/impugnadas (SRI)</strong>
        </label>
        {deudasChecked && (
          <div style={{ margin: "8px 0 16px 24px" }}>
            <input
              type="text"
              placeholder="Cédula (10) o RUC (13). Si lo dejas vacío, usamos el RUC de arriba (si está marcado)."
              value={deudasValue}
              onChange={(e) => setDeudasValue(e.target.value)}
              disabled={isSubmitting}
              style={{ width: "100%", padding: 8 }}
            />
            <small style={{ color: "#666" }}>
              Si lo dejas vacío y marcaste RUC, se reutiliza ese valor.
            </small>
          </div>
        )}

        {/* Denuncias (Fiscalías) */}
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            checked={denunciasChecked}
            onChange={(e) => setDenunciasChecked(e.target.checked)}
            disabled={isSubmitting}
          />
          <strong>Denuncias (Fiscalías)</strong>
        </label>
        {denunciasChecked && (
          <div style={{ margin: "8px 0 16px 24px" }}>
            <input
              type="text"
              placeholder="Nombres completos (p. ej.: Juan Perez)"
              value={denunciasValue}
              onChange={(e) => setDenunciasValue(e.target.value)}
              disabled={isSubmitting}
              style={{ width: "100%", padding: 8 }}
            />
            <small style={{ color: "#666" }}>
              Requerido: ingresa los nombres completos.
            </small>
          </div>
        )}

        {/* Opciones 
        <div style={{ marginTop: 12 }}>
          <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={headless}
              onChange={(e) => setHeadless(e.target.checked)}
              disabled={isSubmitting}
            />
            Ejecutar headless (no recomendado por CAPTCHA)
          </label>
        </div>*/}

        <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
          <button type="submit" disabled={isSubmitting} style={{ padding: "8px 16px" }}>
            {isSubmitting ? "Procesando..." : "Consultar"}
          </button>
          <button type="button" onClick={resetAll} disabled={isSubmitting} style={{ padding: "8px 16px" }}>
            Limpiar
          </button>
        </div>
      </form>

      {/* Estado */}
      <div style={{ marginTop: 16 }}>
        {jobId && (
          <div style={{ padding: 12, background: "#f7f7f7", borderRadius: 8 }}>
            <div><strong>Job ID:</strong> {jobId}</div>
            <div><strong>Estado:</strong> {jobStatus || "–"}</div>
            {jobStatus === "running" && (
              <div style={{ marginTop: 8, color: "#666" }}>
                Ejecutando en el backend… recuerda que hay espera entre páginas (configurable).
              </div>
            )}
          </div>
        )}
        {error && (
          <div style={{ marginTop: 12, padding: 12, background: "#fee", border: "1px solid #fbb", borderRadius: 8, color: "#900" }}>
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>

      {/* Resultado */}
      {resultData && (
        <div style={{ marginTop: 16, padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
          <h3>Resultado</h3>
          <ul>
            {Object.entries(resultData).map(([tipo, payload]) => (
              <li key={tipo} style={{ marginBottom: 8 }}>
                <strong>{tipo}:</strong>{" "}
                {payload?.screenshot_path
                  ? <span>{payload.screenshot_path}</span>
                  : <em>Sin datos o falló la captura.</em>}
              </li>
            ))}
          </ul>
          <small style={{ color: "#666" }}>
            (Mostramos solo la ruta de la captura; más adelante lo uniremos en un .docx.)
          </small>
        </div>
      )}
    </div>
  );
}
