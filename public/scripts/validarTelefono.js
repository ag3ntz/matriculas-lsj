export function formatearTelefono(valor) {
  return valor.replace(/[^+\d]/g, "");
}

export function validarTelefono(valor) {
  const limpio = formatearTelefono(valor);
  return /^(\+?56)?9\d{8}$/.test(limpio);
}

export function inicializarValidacionTelefono() {
  const telInputs = document.querySelectorAll("input[type='tel']");

  telInputs.forEach((input) => {
    const feedback = document.createElement("div");
    feedback.classList.add("telFeedback");
    input.insertAdjacentElement("afterend", feedback);

    input.addEventListener("input", () => {
      const valor = input.value;

      if (valor.length === 0) {
        input.classList.remove("input-valido", "input-invalido");
        feedback.textContent = "";
        return;
      }

      const valido = validarTelefono(valor);

      input.classList.toggle("input-valido", valido);
      input.classList.toggle("input-invalido", !valido);

      if (valido) {
        feedback.textContent = "✔ Teléfono válido";
        feedback.style.color = "green";
      } else {
        feedback.textContent = "✗ Formato esperado: +569XXXXXXXX";
        feedback.style.color = "red";
      }
    });
  });
}
