import { useMemo, useState } from "react"
import ConfirmModal from "./ConfirmModal"
import { RULES, sanitize, validate } from "../lib/validation"
import { sendQuery } from "../lib/api"

export default function QueryForm() {
  const [selected, setSelected] = useState({
    ruc: false,
    apellidos: false,
    placa: false
  })

  const [values, setValues] = useState({
    ruc: "",
    apellidos: "",
    placa: ""
  })

  const [touched, setTouched] = useState({})
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [serverMsg, setServerMsg] = useState(null)

  const { errors, isValid, selectedCount } = useMemo(
    () => validate(values, selected),
    [values, selected]
  )

  function toggle(key) {
    setSelected(prev => {
      const next = { ...prev, [key]: !prev[key] }
      // limpiar valor si se desmarca
      if (prev[key] && values[key]) {
        setValues(v => ({ ...v, [key]: "" }))
        setTouched(t => ({ ...t, [key]: false }))
      }
      return next
    })
  }

  function onChange(key, v) {
    const clean = sanitize(key, v)
    setValues(prev => ({ ...prev, [key]: clean }))
  }

  function onBlur(key) {
    setTouched(prev => ({ ...prev, [key]: true }))
  }

  function submit() {
    if (!isValid) return
    setModalOpen(true)
  }

  async function confirmSend() {
    try {
      setSubmitting(true)
      setServerMsg(null)

      // Construir payload solo con campos seleccionados
      const payload = {
        criterios: Object.keys(selected).filter(k => selected[k]),
        datos: Object.fromEntries(
          Object.entries(values).filter(([k]) => selected[k])
        )
      }

      const resp = await sendQuery(payload)

      setServerMsg({
        type: "ok",
        text:
          resp?.mensaje ||
          "Solicitud enviada. El backend está procesando el scraping."
      })
      setModalOpen(false)
      // (opcional) limpiar formulario:
      // resetAll()
    } catch (err) {
      setServerMsg({ type: "err", text: err.message })
      setModalOpen(false)
    } finally {
      setSubmitting(false)
    }
  }

  function resetAll() {
    setSelected({ ruc: false, apellidos: false, placa: false })
    setValues({ ruc: "", apellidos: "", placa: "" })
    setTouched({})
  }

  return (
    <div className="space-y-6">
      {/* Checkboxes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <CheckboxTile
          label={RULES.ruc.label}
          checked={selected.ruc}
          onChange={() => toggle("ruc")}
          hint="Máx. 13 dígitos"
        />
        <CheckboxTile
          label={RULES.apellidos.label}
          checked={selected.apellidos}
          onChange={() => toggle("apellidos")}
          hint="Solo letras y espacios"
        />
        <CheckboxTile
          label={RULES.placa.label}
          checked={selected.placa}
          onChange={() => toggle("placa")}
          hint="Ej: ABC-1234"
        />
      </div>

      {/* Inputs condicionales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {selected.ruc && (
          <Field
            id="ruc"
            label="Ingrese RUC"
            placeholder="Ej: 1002007001001"
            value={values.ruc}
            onChange={(e) => onChange("ruc", e.target.value)}
            onBlur={() => onBlur("ruc")}
            error={touched.ruc && errors.ruc}
            maxLength={RULES.ruc.max}
          />
        )}
        {selected.apellidos && (
          <Field
            id="apellidos"
            label="Ingrese Apellidos"
            placeholder="Ej: MACÍAS VILLAMAR"
            value={values.apellidos}
            onChange={(e) => onChange("apellidos", e.target.value)}
            onBlur={() => onBlur("apellidos")}
            error={touched.apellidos && errors.apellidos}
            maxLength={RULES.apellidos.max}
          />
        )}
        {selected.placa && (
          <Field
            id="placa"
            label="Placa"
            placeholder="Ej: ABC1234"
            value={values.placa}
            onChange={(e) => onChange("placa", e.target.value)}
            onBlur={() => onBlur("placa")}
            error={touched.placa && errors.placa}
            maxLength={RULES.placa.max}
          />
        )}
      </div>

      {/* Estado y acciones */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          className="button-primary disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={submit}
          disabled={!isValid || submitting}
          title={
            selectedCount === 0
              ? "Marca al menos un criterio"
              : Object.keys(errors).length > 0
              ? "Corrige los campos marcados"
              : "Enviar consulta"
          }
        >
          Consultar
        </button>

        <button
          className="px-4 py-3 rounded-xl border border-stone-700 hover:bg-stone-800 transition"
          onClick={resetAll}
          disabled={submitting}
        >
          Limpiar
        </button>

        <span className="text-sm text-stone-400">
          {selectedCount === 0
            ? "Selecciona al menos un criterio."
            : `Seleccionados: ${selectedCount}`}
        </span>
      </div>

      {/* Mensaje del servidor */}
      {serverMsg && (
        <div
          className={`mt-2 text-sm px-3 py-2 rounded-lg border ${
            serverMsg.type === "ok"
              ? "border-green-700 bg-green-900/30 text-green-300"
              : "border-red-700 bg-red-900/30 text-red-300"
          }`}
        >
          {serverMsg.text}
        </div>
      )}

      {/* Modal */}
      <ConfirmModal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onConfirm={confirmSend}
        loading={submitting}
      />
    </div>
  )
}

function CheckboxTile({ label, checked, onChange, hint }) {
  return (
    <label
      className={`group relative cursor-pointer select-none rounded-2xl border p-4 transition ${
        checked
          ? "bg-brand-gradient text-white border-transparent"
          : "bg-stone-900/50 text-stone-200 border-stone-800 hover:border-stone-600"
      }`}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          className="mt-1.5 h-5 w-5 accent-primary"
          checked={checked}
          onChange={onChange}
        />
        <div>
          <div className="text-base font-semibold">{label}</div>
          <div className={`text-xs ${checked ? "text-white/80" : "text-stone-400"}`}>
            {hint}
          </div>
        </div>
      </div>
    </label>
  )
}

function Field({ id, label, placeholder, value, onChange, onBlur, error, maxLength }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm mb-1">{label}</label>
      <input
        id={id}
        className="input-base"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        maxLength={maxLength}
        autoComplete="off"
      />
      <div className="mt-1 h-5 text-xs">
        {error ? <span className="text-red-400">{error}</span> : <span className="text-stone-400">Máx. {maxLength} caracteres</span>}
      </div>
    </div>
  )
}

