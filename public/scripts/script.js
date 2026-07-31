import { inicializarFormateoNombres } from "./formatearNombre.js";
import { limpiarRut, formatearRut, validarRut } from "./validarRut.js";
import { validarCorreo } from "./validarCorreo.js";
import { validarTelefono, inicializarValidacionTelefono } from "./validarTelefono.js";

const GAS_URL = "https://script.google.com/macros/s/AKfycbxK80xoVNDKVYwQIY1SDCxYHPF1nY79b5xuUeoA3z58IU5XcIGgq6IwEvWD4QJ7k42acg/exec";

function toggleField(selectId, triggerValue, containerId, inputId) {
  const select = document.getElementById(selectId);
  const container = document.getElementById(containerId);
  const input = document.getElementById(inputId);

  if (!select || !container || !input) return;

  select.addEventListener("change", () => {
    const active = select.value === triggerValue;

    container.style.display = active ? "block" : "none";
    input.required = active;

    if (!active) input.value = "";
  });
}

function configurarRut() {
  const rutInputs = document.querySelectorAll("input[data-tipo='rut']");

  rutInputs.forEach((input) => {
    const feedback = document.createElement("div");
    feedback.classList.add("rutFeedback");
    input.insertAdjacentElement("afterend", feedback);

    input.addEventListener("input", () => {
      const rutLimpio = limpiarRut(input.value);
      input.value = formatearRut(rutLimpio);

      if (rutLimpio.length >= 8) {
        const valido = validarRut(rutLimpio);

        input.classList.toggle("input-valido", valido);
        input.classList.toggle("input-invalido", !valido);

        feedback.textContent = valido ? "✔ RUT válido" : "✗ RUT inválido";
        feedback.style.color = valido ? "green" : "red";
      } else {
        input.classList.remove("input-valido", "input-invalido");
        feedback.textContent = "";
      }
    });
  });
}

function calcularEdad() {
  const fechaNacInput = document.getElementById("fechaNacimiento");
  const edadInput = document.getElementById("edad");

  if (!fechaNacInput || !edadInput) return;

  fechaNacInput.addEventListener("change", () => {
    const fechaNac = new Date(fechaNacInput.value);

    if (isNaN(fechaNac)) {
      edadInput.value = "";
      return;
    }

    const hoy = new Date();
    let edad = hoy.getFullYear() - fechaNac.getFullYear();

    if (
      hoy.getMonth() < fechaNac.getMonth() ||
      (hoy.getMonth() === fechaNac.getMonth() && hoy.getDate() < fechaNac.getDate())
    ) {
      edad--;
    }

    edadInput.value = edad >= 0 ? edad : "";
  });
}

function formatearFecha(fecha) {
  if (!fecha) return "";
  const partes = fecha.split("-");
  if (partes.length !== 3) return fecha;
  return `${partes[2]}-${partes[1]}-${partes[0]}`;
}

function serializarFormulario() {
  const form = document.getElementById("formPrematricula");
  const fd = new FormData(form);
  const data = Object.fromEntries(fd.entries());

  const condicionalesReemplazar = [
    { select: "nacionalidad", detail: "otraNacionalidad" },
    { select: "viveCon", detail: "otraVivecon" },
    { select: "colegioProcedencia", detail: "otroColegio" },
  ];

  const condicionalesMantener = [
    { select: "programaSocial", detail: "otraProgramaSocial" },
    { select: "etnia", detail: "otraEtnia" },
    { select: "tratamientoMedico", detail: "defTratMedico" },
    { select: "programaEscolar", detail: "defProgramaEscolar" },
    { select: "alergiaMed", detail: "defAlergiaMed" },
    { select: "contraMedica", detail: "defContraMedica" },
    { select: "movEscolar", detail: "defMovEscolar" },
  ];

  for (const { select, detail } of condicionalesReemplazar) {
    if (data[detail] && data[detail].trim()) {
      data[select] = data[detail];
    }
    delete data[detail];
  }

  for (const { select, detail } of condicionalesMantener) {
    if (!data[detail] || !data[detail].trim()) {
      data[detail] = "------";
    }
  }

  for (const key of Object.keys(data)) {
    if (key.startsWith("fechaNac") || key === "fechaNacimiento") {
      data[key] = formatearFecha(data[key]);
    }
  }

  return data;
}

function validarFormulario() {
  const errores = [];

  document.querySelectorAll("[required]").forEach((el) => {
    if (el.disabled) return;
    if (!el.value || !el.value.trim()) {
      const label = el.closest("label");
      const texto = label ? label.textContent.replace(/[*]/g, "").trim() : el.name;
      errores.push({ campo: el, msg: `"${texto}" es obligatorio` });
    }
  });

  document.querySelectorAll("[data-tipo='rut']").forEach((el) => {
    if (el.value && !validarRut(limpiarRut(el.value))) {
      errores.push({ campo: el, msg: "RUT inválido" });
    }
  });

  document.querySelectorAll("[id$='Container']").forEach((container) => {
    if (container.style.display !== "none") {
      const input = container.querySelector("input[type='text']");
      if (input && !input.value.trim()) {
        const label = container.querySelector("label");
        const texto = label ? label.textContent.trim() : input.name;
        errores.push({ campo: input, msg: `"${texto}" es obligatorio` });
      }
    }
  });

  document.querySelectorAll("input[type='tel']").forEach((el) => {
    if (el.value && !validarTelefono(el.value)) {
      errores.push({ campo: el, msg: "Formato esperado: +569XXXXXXXX" });
    }
  });

  return errores;
}

function mostrarErrores(errores) {
  const summary = document.getElementById("errorSummary");
  if (!summary) return;

  summary.innerHTML = errores
    .map((e) => `<div class="error-item">• ${e.msg}</div>`)
    .join("");
  summary.style.display = "block";
  summary.scrollIntoView({ behavior: "smooth", block: "center" });

  errores.forEach((e) => {
    e.campo.classList.add("input-error");
    e.campo.focus({ preventScroll: true });
  });
}

function limpiarErrores() {
  document.querySelectorAll(".input-error").forEach((el) => el.classList.remove("input-error"));
  const summary = document.getElementById("errorSummary");
  if (summary) {
    summary.style.display = "none";
    summary.innerHTML = "";
  }
}

function setLoading(loading) {
  const form = document.getElementById("formPrematricula");
  const btn = document.querySelector("button[type='submit']");

  if (!form || !btn) return;

  btn.disabled = loading;
  btn.textContent = loading ? "Enviando..." : "Enviar formulario";

  form.querySelectorAll("input, select, textarea, button").forEach((el) => {
    if (el === btn) return;
    el.toggleAttribute("disabled", loading);
  });

  if (loading) {
    Notiflix.Loading.circle({ backgroundColor: "rgba(0,0,0,0.1)" });
  } else {
    Notiflix.Loading.remove();
  }
}

async function enviarFormulario() {
  if (!GAS_URL) {
    Notiflix.Notify.failure("GAS_URL no configurado");
    return;
  }

  const data = serializarFormulario();
  setLoading(true);

  try {
    const respuesta = await enviar(data);

    if (respuesta.status === "DUPLICATE") {
      setLoading(false);
      Notiflix.Confirm.show(
        "Registro duplicado",
        respuesta.message,
        "Sí, enviar",
        "Cancelar",
        async () => {
          setLoading(true);
          data.force = true;
          try {
            const respuesta2 = await enviar(data);
            procesarRespuesta(respuesta2);
          } catch (err) {
            Notiflix.Notify.failure(err.message || "Error de conexión");
          } finally {
            setLoading(false);
          }
        }
      );
    } else {
      procesarRespuesta(respuesta);
      setLoading(false);
    }
  } catch (err) {
    Notiflix.Notify.failure(err.message || "Error de conexión");
    setLoading(false);
  }
}

async function enviar(data) {
  const params = new URLSearchParams();
  for (const [key, val] of Object.entries(data)) {
    params.append(key, val);
  }

  const res = await fetch(GAS_URL, {
    method: "POST",
    body: params,
  });

  const text = await res.text();
  return JSON.parse(text);
}

function mostrarPantallaExito() {
  document.getElementById("formPrematricula").style.display = "none";
  document.getElementById("postEnvio").style.display = "block";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function reiniciarFormulario() {
  document.getElementById("postEnvio").style.display = "none";
  const form = document.getElementById("formPrematricula");
  form.style.display = "block";
  form.reset();
  document.querySelectorAll(".input-valido, .input-invalido, .rutFeedback").forEach((el) => {
    el.textContent = "";
    el.classList.remove("input-valido", "input-invalido");
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function procesarRespuesta(respuesta) {
  if (respuesta.status === "OK") {
    Notiflix.Report.success(
      "Matrícula registrada",
      `PDF generado:\n${respuesta.pdfUrl}`,
      "Aceptar",
      mostrarPantallaExito
    );
  } else if (respuesta.status === "ERROR") {
    Notiflix.Report.failure("Error", respuesta.message, "Aceptar");
  }
}

function manejarSubmit(e) {
  e.preventDefault();
  limpiarErrores();

  const errores = validarFormulario();

  if (errores.length > 0) {
    mostrarErrores(errores);
    return;
  }

  enviarFormulario();
}

document.addEventListener("DOMContentLoaded", () => {
  Notiflix.Notify.init({ position: "right-top", timeout: 4000 });
  Notiflix.Confirm.init({ zindex: 9999 });

  configurarRut();
  calcularEdad();
  inicializarFormateoNombres();
  validarCorreo();
  inicializarValidacionTelefono();

  toggleField("nacionalidad", "Otro", "nacionalidadContainer", "nacionalidadInput");
  toggleField("viveCon", "Otro", "viveConContainer", "viveConInput");
  toggleField("programaSocial", "Si", "programaSocialContainer", "programaSocialInput");
  toggleField("etnia", "Si", "etniaContainer", "etniaInput");
  toggleField("tratamientoMedico", "Si", "tratamientoMedicoContainer", "tratamientoMedicoInput");
  toggleField("programaEscolar", "Si", "programaEscolarContainer", "programaEscolarInput");
  toggleField("colegioProcedencia", "Otro", "colegioProcedenciaContainer", "colegioProcedenciaInput");
  toggleField("alergiaMed", "Si", "alergiaMedContainer", "alergiaMedInput");
  toggleField("contraMedica", "Si", "contraMedicaContainer", "contraMedicaInput");
  toggleField("movEscolar", "Si", "movEscolarContainer", "movEscolarInput");

  document.getElementById("formPrematricula").addEventListener("submit", manejarSubmit);

  document.getElementById("btnOtraMatricula").addEventListener("click", reiniciarFormulario);
  document.getElementById("btnSalir").addEventListener("click", () => {
    window.location.href = "/";
  });
});
