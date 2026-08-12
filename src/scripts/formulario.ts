import { inicializarFormateoNombres } from "./formatearNombre.ts";
import { limpiarRut, formatearRut, validarRut } from "./validarRut.ts";
import { validarCorreo } from "./validarCorreo.ts";
import {
  validarTelefono,
  inicializarValidacionTelefono,
} from "./validarTelefono.ts";
import { formatearFecha } from "./formatearFecha.ts";
import { GAS_URL, RECAPTCHA_SITE_KEY } from "./config.ts";

type CampoFormulario =
  HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
type DatosFormulario = Record<string, string | boolean>;

interface RespuestaGAS {
  estado: string;
  mensaje?: string;
  pdfUrl?: string;
}

interface ErrorCampo {
  campo: CampoFormulario;
  msg: string;
}

async function obtenerTokenReCaptcha(): Promise<string> {
  if (!RECAPTCHA_SITE_KEY || typeof grecaptcha === "undefined") return "";

  return new Promise((resolve) => {
    grecaptcha.ready(() => {
      grecaptcha
        .execute(RECAPTCHA_SITE_KEY, { action: "submit" })
        .then(resolve)
        .catch(() => resolve(""));
    });
  });
}

function obtenerTextoEtiqueta(el: CampoFormulario): string {
  const label = el.closest("label");
  if (label) return (label.textContent ?? "").replace(/[*]/g, "").trim();
  const labelFor = document.querySelector(`label[for="${el.id}"]`);
  if (labelFor) return (labelFor.textContent ?? "").replace(/[*]/g, "").trim();
  return el.name;
}

function alternarCampo(
  nombreSelect: string,
  idContenedor: string,
  idEntrada: string,
) {
  const select = document.getElementById(
    nombreSelect,
  ) as HTMLSelectElement | null;
  const contenedor = document.getElementById(idContenedor);
  const entrada = document.getElementById(idEntrada) as HTMLInputElement | null;

  if (!select || !contenedor || !entrada) return;

  const valorDisparador = select.dataset.valorDisparador;

  select.addEventListener("change", () => {
    const activo = select.value === valorDisparador;

    contenedor.style.display = activo ? "block" : "none";
    entrada.required = activo;

    if (!activo) entrada.value = "";
  });
}

function configurarRut() {
  const entradasRut = document.querySelectorAll<HTMLInputElement>(
    "input[data-tipo='rut']",
  );

  entradasRut.forEach((entrada) => {
    const feedback = document.createElement("div");
    feedback.classList.add("feedback-rut");
    entrada.insertAdjacentElement("afterend", feedback);

    entrada.addEventListener("input", () => {
      const rutLimpio = limpiarRut(entrada.value);
      entrada.value = formatearRut(rutLimpio);

      if (rutLimpio.length >= 8) {
        const valido = validarRut(rutLimpio);

        entrada.classList.toggle("input-valido", valido);
        entrada.classList.toggle("input-invalido", !valido);

        feedback.textContent = valido ? "✔ RUT válido" : "✗ RUT inválido";
        feedback.style.color = valido ? "green" : "red";
      } else {
        entrada.classList.remove("input-valido", "input-invalido");
        feedback.textContent = "";
      }
    });
  });
}

function calcularEdad() {
  const fechaNacInput = document.getElementById(
    "fechaNacimiento",
  ) as HTMLInputElement | null;
  const edadInput = document.getElementById("edad") as HTMLInputElement | null;

  if (!fechaNacInput || !edadInput) return;

  fechaNacInput.addEventListener("change", () => {
    const fechaNac = new Date(fechaNacInput.value);

    if (Number.isNaN(fechaNac.getTime())) {
      edadInput.value = "";
      return;
    }

    const hoy = new Date();
    let edad = hoy.getFullYear() - fechaNac.getFullYear();

    if (
      hoy.getMonth() < fechaNac.getMonth() ||
      (hoy.getMonth() === fechaNac.getMonth() &&
        hoy.getDate() < fechaNac.getDate())
    ) {
      edad--;
    }

    edadInput.value = edad >= 0 ? String(edad) : "";
  });
}

const MAPEO_APODERADO_A_PADRE: Record<string, string> = {
  rutApoderado: "rutPadre",
  nombreApoderado: "nombrePadre",
  fechaNacApoderado: "fechaNacPadre",
  domicilioApoderado: "domicilioPadre",
  comunaApoderado: "comunaPadre",
  profesionApoderado: "profesionPadre",
  escolaridadApoderado: "escolaridadPadre",
};

const MAPEO_APODERADO_A_MADRE: Record<string, string> = {
  rutApoderado: "rutMadre",
  nombreApoderado: "nombreMadre",
  fechaNacApoderado: "fechaNacMadre",
  domicilioApoderado: "domicilioMadre",
  comunaApoderado: "comunaMadre",
  profesionApoderado: "profesionMadre",
  escolaridadApoderado: "escolaridadMadre",
};

let limpiarSincronizacionApoderado: (() => void) | null = null;

function configurarSincronizacionApoderado() {
  const selector = document.getElementById(
    "apoderadoOrigen",
  ) as HTMLSelectElement | null;
  if (!selector) return;

  selector.addEventListener("change", () => {
    limpiarSincronizacionApoderado?.();

    if (selector.value === "Padre") {
      aplicarSincronizacionApoderado(MAPEO_APODERADO_A_PADRE);
    } else if (selector.value === "Madre") {
      aplicarSincronizacionApoderado(MAPEO_APODERADO_A_MADRE);
    }
  });
}

function aplicarSincronizacionApoderado(mapeo: Record<string, string>) {
  copiarDesdeApoderado(mapeo);

  const listeners: Array<{
    el: HTMLInputElement;
    fn: () => void;
  }> = [];

  for (const [origen, destino] of Object.entries(mapeo)) {
    const elOrigen = document.getElementById(origen) as HTMLInputElement | null;
    if (!elOrigen) continue;

    const fn = () => {
      const elDestino = document.getElementById(destino) as
        HTMLInputElement | HTMLSelectElement | null;
      if (elDestino) elDestino.value = elOrigen.value;
    };

    elOrigen.addEventListener("input", fn);
    elOrigen.addEventListener("change", fn);
    listeners.push({ el: elOrigen, fn });
  }

  limpiarSincronizacionApoderado = () => {
    for (const { el, fn } of listeners) {
      el.removeEventListener("input", fn);
      el.removeEventListener("change", fn);
    }
    limpiarSincronizacionApoderado = null;
  };
}

function copiarDesdeApoderado(mapeo: Record<string, string>) {
  for (const [origen, destino] of Object.entries(mapeo)) {
    const elOrigen = document.getElementById(origen) as HTMLInputElement | null;
    const elDestino = document.getElementById(destino) as
      HTMLInputElement | HTMLSelectElement | null;
    if (elOrigen && elDestino) elDestino.value = elOrigen.value;
  }
}

function restablecerSincronizacionApoderado() {
  limpiarSincronizacionApoderado?.();
  const selector = document.getElementById(
    "apoderadoOrigen",
  ) as HTMLSelectElement | null;
  if (selector) selector.value = "";
}

function serializarFormulario(): DatosFormulario {
  const form = document.getElementById(
    "formularioPrematricula",
  ) as HTMLFormElement | null;
  if (!form) return {};

  const datosForm = new FormData(form);
  const datos = Object.fromEntries(
    datosForm.entries(),
  ) as unknown as DatosFormulario;

  const condicionalesReemplazar = [
    { campo: "nacionalidad", detalle: "nacionalidadDetalle" },
    { campo: "viveCon", detalle: "viveConDetalle" },
    { campo: "colegioProcedencia", detalle: "colegioProcedenciaDetalle" },
  ];

  const condicionalesMantener = [
    { campo: "programaSocial", detalle: "programaSocialDetalle" },
    { campo: "etnia", detalle: "etniaDetalle" },
    { campo: "tratamientoMedico", detalle: "tratamientoMedicoDetalle" },
    { campo: "programaEscolar", detalle: "programaEscolarDetalle" },
    { campo: "alergiaMed", detalle: "alergiaMedDetalle" },
    { campo: "contraMedica", detalle: "contraMedicaDetalle" },
    { campo: "movEscolar", detalle: "movEscolarDetalle" },
  ];

  for (const { campo, detalle } of condicionalesReemplazar) {
    const valor = datos[detalle];
    if (typeof valor === "string" && valor.trim()) {
      datos[campo] = valor;
    }
    delete datos[detalle];
  }

  for (const { detalle } of condicionalesMantener) {
    const valor = datos[detalle];
    if (typeof valor !== "string" || !valor.trim()) {
      datos[detalle] = "------";
    }
  }

  for (const clave of Object.keys(datos)) {
    if (
      (clave.startsWith("fechaNac") || clave === "fechaNacimiento") &&
      typeof datos[clave] === "string"
    ) {
      datos[clave] = formatearFecha(datos[clave]);
    }
  }

  return datos;
}

function validarFormulario(): ErrorCampo[] {
  const errores: ErrorCampo[] = [];

  document.querySelectorAll<CampoFormulario>("[required]").forEach((el) => {
    if (el.disabled) return;
    if (!el.value || !el.value.trim()) {
      const texto = obtenerTextoEtiqueta(el);
      errores.push({ campo: el, msg: `"${texto}" es obligatorio` });
    }
  });

  document
    .querySelectorAll<HTMLInputElement>("[data-tipo='rut']")
    .forEach((el) => {
      if (el.value && !validarRut(limpiarRut(el.value))) {
        errores.push({ campo: el, msg: "RUT inválido" });
      }
    });

  document
    .querySelectorAll<HTMLElement>("[id$='Contenedor']")
    .forEach((contenedor) => {
      if (contenedor.style.display !== "none") {
        const entrada =
          contenedor.querySelector<HTMLInputElement>("input[type='text']");
        if (entrada && !entrada.value.trim()) {
          const label = contenedor.querySelector("label");
          const texto = label ? (label.textContent ?? "").trim() : entrada.name;
          errores.push({ campo: entrada, msg: `"${texto}" es obligatorio` });
        }
      }
    });

  document
    .querySelectorAll<HTMLInputElement>("input[type='tel']")
    .forEach((el) => {
      if (el.value && !validarTelefono(el.value)) {
        errores.push({ campo: el, msg: "Formato esperado: +569XXXXXXXX" });
      }
    });

  return errores;
}

function mostrarErrores(errores: ErrorCampo[]) {
  const resumen = document.getElementById("resumenErrores");
  if (!resumen) return;

  resumen.innerHTML = errores
    .map((e) => `<div class="error-item">• ${e.msg}</div>`)
    .join("");
  resumen.style.display = "block";
  resumen.scrollIntoView({ behavior: "smooth", block: "center" });

  errores.forEach((e) => {
    e.campo.classList.add("input-error");
    e.campo.focus({ preventScroll: true });
  });
}

function limpiarErrores() {
  document
    .querySelectorAll(".input-error")
    .forEach((el) => el.classList.remove("input-error"));
  const resumen = document.getElementById("resumenErrores");
  if (resumen) {
    resumen.style.display = "none";
    resumen.innerHTML = "";
  }
}

function establecerCarga(cargando: boolean) {
  const form = document.getElementById("formularioPrematricula");
  const btn = document.querySelector<HTMLButtonElement>(
    "button[type='submit']",
  );

  if (!form || !btn) return;

  btn.disabled = cargando;
  btn.textContent = cargando ? "Enviando..." : "Enviar formulario";

  form.querySelectorAll("input, select, textarea, button").forEach((el) => {
    if (el === btn) return;
    el.toggleAttribute("disabled", cargando);
  });

  if (cargando) {
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

  const datos = serializarFormulario();
  establecerCarga(true);

  const token = await obtenerTokenReCaptcha();
  if (RECAPTCHA_SITE_KEY && !token) {
    establecerCarga(false);
    Notiflix.Notify.failure(
      "No se pudo completar la verificación de seguridad. Recargue la página e intente nuevamente.",
    );
    return;
  }
  if (token) datos.recaptchaToken = token;

  try {
    const respuesta = await enviarSolicitud(datos);

    if (respuesta.estado === "DUPLICATE") {
      establecerCarga(false);
      Notiflix.Confirm.show(
        "Registro duplicado",
        respuesta.mensaje ?? "",
        "Sí, enviar",
        "Cancelar",
        async () => {
          establecerCarga(true);
          datos.force = true;
          try {
            const respuesta2 = await enviarSolicitud(datos);
            procesarRespuesta(respuesta2);
          } catch (err) {
            const msg =
              err instanceof Error ? err.message : "Error de conexión";
            Notiflix.Notify.failure(msg);
          } finally {
            establecerCarga(false);
          }
        },
      );
    } else {
      procesarRespuesta(respuesta);
      establecerCarga(false);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error de conexión";
    Notiflix.Notify.failure(msg);
    establecerCarga(false);
  }
}

async function enviarSolicitud(datos: DatosFormulario): Promise<RespuestaGAS> {
  const params = new URLSearchParams();
  for (const [clave, valor] of Object.entries(datos)) {
    params.append(clave, String(valor));
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch(GAS_URL, {
      method: "POST",
      body: params,
      signal: controller.signal,
    });

    const text = await res.text();
    return JSON.parse(text) as RespuestaGAS;
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("La solicitud tardó demasiado. Intente nuevamente.", {
        cause: err,
      });
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

function mostrarPantallaExito() {
  document.getElementById("formularioPrematricula")!.style.display = "none";
  document.getElementById("postEnvio")!.style.display = "block";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function reiniciarFormulario() {
  document.getElementById("postEnvio")!.style.display = "none";
  const form = document.getElementById(
    "formularioPrematricula",
  ) as HTMLFormElement | null;
  if (!form) return;
  form.style.display = "block";
  form.reset();
  restablecerSincronizacionApoderado();
  document
    .querySelectorAll(
      ".input-valido, .input-invalido, .feedback-rut, .feedback-correo, .feedback-tel",
    )
    .forEach((el) => {
      el.textContent = "";
      el.classList.remove("input-valido", "input-invalido");
    });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function procesarRespuesta(respuesta: RespuestaGAS) {
  if (respuesta.estado === "OK") {
    Notiflix.Report.success(
      "Matrícula registrada",
      `PDF generado:\n${respuesta.pdfUrl ?? ""}`,
      "Aceptar",
      mostrarPantallaExito,
    );
  } else if (respuesta.estado === "ERROR") {
    Notiflix.Report.failure("Error", respuesta.mensaje ?? "", "Aceptar");
  }
}

function manejarSubmit(e: Event) {
  e.preventDefault();
  limpiarErrores();

  const errores = validarFormulario();

  if (errores.length > 0) {
    mostrarErrores(errores);
    return;
  }

  void enviarFormulario();
}

document.addEventListener("DOMContentLoaded", () => {
  Notiflix.Notify.init({ position: "right-top", timeout: 4000 });
  Notiflix.Confirm.init({ zindex: 9999 });

  configurarRut();
  calcularEdad();
  configurarSincronizacionApoderado();
  inicializarFormateoNombres();
  validarCorreo();
  inicializarValidacionTelefono();

  alternarCampo(
    "nacionalidad",
    "nacionalidadContenedor",
    "nacionalidadEntrada",
  );
  alternarCampo("viveCon", "viveConContenedor", "viveConEntrada");
  alternarCampo(
    "programaSocial",
    "programaSocialContenedor",
    "programaSocialEntrada",
  );
  alternarCampo("etnia", "etniaContenedor", "etniaEntrada");
  alternarCampo(
    "tratamientoMedico",
    "tratamientoMedicoContenedor",
    "tratamientoMedicoEntrada",
  );
  alternarCampo(
    "programaEscolar",
    "programaEscolarContenedor",
    "programaEscolarEntrada",
  );
  alternarCampo(
    "colegioProcedencia",
    "colegioProcedenciaContenedor",
    "colegioProcedenciaEntrada",
  );
  alternarCampo("alergiaMed", "alergiaMedContenedor", "alergiaMedEntrada");
  alternarCampo(
    "contraMedica",
    "contraMedicaContenedor",
    "contraMedicaEntrada",
  );
  alternarCampo("movEscolar", "movEscolarContenedor", "movEscolarEntrada");

  const form = document.getElementById("formularioPrematricula");
  const btnOtraMatricula = document.getElementById("btnOtraMatricula");
  const btnSalir = document.getElementById("btnSalir");

  form?.addEventListener("submit", manejarSubmit);
  btnOtraMatricula?.addEventListener("click", reiniciarFormulario);
  btnSalir?.addEventListener("click", () => {
    window.location.href = "/";
  });
});
