import { useEffect, useRef, useState } from "react";
import { createConsultas, getJobStatus } from "../lib/api";

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
  const [predioMantaChecked, setPredioMantaChecked] = useState(false); // placeholder
  const [predioQuitoNombres, setPredioQuitoNombres] = useState("");

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

    // Predio Manta (placeholder)
    if (predioMantaChecked) {
      throw new Error("Predio Manta aún no está disponible.");
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

    setRucValue("");
    setDeudasValue("");
    setDenunciasValue("");
    setMvValue("");
    setInterpolApellidos("");
    setInterpolNombres("");
    setGoogleQuery("");
    setContraloriaCedula("");
    setSpValue("");

    setHeadless(false);
    setJobId(null);
    setJobStatus(null);
    setResultData(null);
    setError(null);
    if (pollRef.current) clearInterval(pollRef.current);
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 16 }}>
      <h2>Criterios de Consulta</h2>

      <form onSubmit={handleSubmit} style={{ marginTop: 12, border: "1px solid #ddd", borderRadius: 8, padding: 16 }}>
        {/* RUC */}
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input type="checkbox" checked={rucChecked} onChange={(e) => setRucChecked(e.target.checked)} disabled={isSubmitting} />
          <strong>Consulta RUC (SRI)</strong>
        </label>
        {rucChecked && (
          <div style={{ margin: "8px 0 16px 24px" }}>
            <input type="text" placeholder="RUC (13 dígitos)" value={rucValue} onChange={(e) => setRucValue(e.target.value)} disabled={isSubmitting} style={{ width: "100%", padding: 8 }} />
            <small style={{ color: "#666" }}>Ej.: 2300531528001</small>
          </div>
        )}

        {/* Deudas */}
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input type="checkbox" checked={deudasChecked} onChange={(e) => setDeudasChecked(e.target.checked)} disabled={isSubmitting} />
          <strong>Deudas firmes/impugnadas (SRI)</strong>
        </label>
        {deudasChecked && (
          <div style={{ margin: "8px 0 16px 24px" }}>
            <input type="text" placeholder="Cédula (10) o RUC (13). Si lo dejas vacío, usamos el RUC de arriba (si está marcado)." value={deudasValue} onChange={(e) => setDeudasValue(e.target.value)} disabled={isSubmitting} style={{ width: "100%", padding: 8 }} />
            <small style={{ color: "#666" }}>Si lo dejas vacío y marcaste RUC, se reutiliza ese valor.</small>
          </div>
        )}

        {/* Denuncias */}
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input type="checkbox" checked={denunciasChecked} onChange={(e) => setDenunciasChecked(e.target.checked)} disabled={isSubmitting} />
          <strong>Denuncias (Fiscalías)</strong>
        </label>
        {denunciasChecked && (
          <div style={{ margin: "8px 0 16px 24px" }}>
            <input type="text" placeholder="Nombres completos (p. ej.: Juan Perez)" value={denunciasValue} onChange={(e) => setDenunciasValue(e.target.value)} disabled={isSubmitting} style={{ width: "100%", padding: 8 }} />
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
            <input type="text" placeholder="Identificación (RUC 13 dígitos) o Nombre de la entidad" value={mvValue} onChange={(e) => setMvValue(e.target.value)} disabled={isSubmitting} style={{ width: "100%", padding: 8 }} />
            <small style={{ color: "#666" }}>Detección automática: si ingresas solo dígitos, debe ser RUC de 13 dígitos; caso contrario se tomará como nombre.</small>
          </div>
        )}

        {/* INTERPOL */}
        <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
          <input type="checkbox" checked={interpolChecked} onChange={(e) => setInterpolChecked(e.target.checked)} disabled={isSubmitting} />
          <strong>INTERPOL – Notificaciones rojas</strong>
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
          <strong>Google – Búsqueda simple</strong>
        </label>
        {googleChecked && (
          <div style={{ margin: "8px 0 16px 24px" }}>
            <input type="text" placeholder='Texto a buscar (p. ej.: "VELA VASCO MARCO ANTONIO")' value={googleQuery} onChange={(e) => setGoogleQuery(e.target.value)} disabled={isSubmitting} style={{ width: "100%", padding: 8 }} />
            <small style={{ color: "#666" }}>Se abrirá Google, se ejecutará la búsqueda y se guardará una captura de la SERP.</small>
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
          <strong>Contraloría – Declaraciones Juradas</strong>
        </label>
        {contraloriaChecked && (
          <div style={{ margin: "8px 0 16px 24px" }}>
            <input
              type="text"
              placeholder="Cédula (exactamente 10 dígitos)"
              value={contraloriaCedula}
              onChange={(e) => setContraloriaCedula(e.target.value)}
              disabled={isSubmitting}
              style={{ width: "100%", padding: 8 }}
            />
            <small style={{ color: "#666" }}>
              Se resolverá automáticamente el captcha y se guardará la captura final.
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
          <strong>Supercias – Consulta de Persona</strong>
        </label>
        {spChecked && (
          <div style={{ margin: "8px 0 16px 24px" }}>
            <input
              type="text"
              placeholder="Cédula (10 dígitos) o Nombre"
              value={spValue}
              onChange={(e) => setSpValue(e.target.value)}
              disabled={isSubmitting}
              style={{ width: "100%", padding: 8 }}
            />
            <small style={{ color: "#666" }}>
              Detección automática: si ingresas 10 dígitos, usa Identificación; caso contrario se usará Nombre.
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
                    Se consultará en pam.quito.gob.ec con resolución de captcha automática.
                  </small>
                </div>
              )}

              {/* Predio Manta (placeholder) */}
              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  checked={predioMantaChecked}
                  onChange={(e) => setPredioMantaChecked(e.target.checked)}
                  disabled
                />
                <span style={{ color: "#999" }}>Predio Manta (próximamente)</span>
              </label>
            </div>
          )}
        </div>
        {/* ============================================================= */}

        <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
          <button type="submit" disabled={isSubmitting} style={{ padding: "8px 16px" }}>
            {isSubmitting ? "Procesando..." : "Consultar"}
          </button>
          <button type="button" onClick={resetAll} disabled={isSubmitting} style={{ padding: "8px 16px" }}>
            Limpiar
          </button>
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
    </div>
  );
}
