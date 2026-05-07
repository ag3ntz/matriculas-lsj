console.log("script cargado");

import { inicializarFormateoNombres } from "./formatearNombre.js";
import { limpiarRut, formatearRut, validarRut } from "./validarRut.js";

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

    rutInputs.forEach(input => {
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

                feedback.textContent = valido
                    ? "✔ RUT válido"
                    : "❌ RUT inválido";

                feedback.style.color = valido ? "green" : "red";
            } else {
                input.classList.remove("input-valido", "input-invalido");
                feedback.textContent = "";
            }
        });
    });
}

function calcularEdad() {
    const fechaNacInput = document.querySelector('input[name="fechaNacimiento"]');
    const edadInput = document.querySelector('input[name="edad"]');

    if (!fechaNacInput || !edadInput) return;

    fechaNacInput.addEventListener("change", () => {
        const fechaNac = new Date(fechaNacInput.value);
        const hoy = new Date();

        let edad = hoy.getFullYear() - fechaNac.getFullYear();

        if (
            hoy.getMonth() < fechaNac.getMonth() ||
            (hoy.getMonth() === fechaNac.getMonth() &&
                hoy.getDate() < fechaNac.getDate())
        ) {
            edad--;
        }

        edadInput.value = edad;
    });
}

 document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM listo");
    configurarRut();
    calcularEdad();
    inicializarFormateoNombres();

    toggleField("nacionalidad", "Otro", "otraNacionalidadContainer", "otraNacionalidad");
    toggleField("viveCon", "Otro", "otraViveconContainer", "otraVivecon");
    toggleField("programaSocial", "Si", "otraProgramaSocialContainer", "otraProgramaSocial");
    toggleField("etnia", "Si", "otraEtniaContainer", "otraEtnia");
    toggleField("tratamientoMedico", "Si", "tratMedicoContainer", "defTratMedico");
    toggleField("programaEscolar", "Si", "programaEscolarContainer", "defProgramaEscolar");
    toggleField("colegioProcedencia", "Otro", "otroColegioContainer", "otroColegio");
});