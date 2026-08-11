export function esCorreoValido(correo: string | null | undefined): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(correo || ""));
}

export function validarCorreo(): void {
  const correo = document.querySelector<HTMLInputElement>(
    'input[name="correoApoderado"]',
  );

  if (!correo) return;

  const feedback = document.createElement("div");
  feedback.classList.add("feedback-correo");
  correo.insertAdjacentElement("afterend", feedback);

  correo.addEventListener("input", () => {
    const valido = esCorreoValido(correo.value);

    correo.classList.toggle("input-valido", valido);
    correo.classList.toggle(
      "input-invalido",
      !valido && correo.value.length > 0,
    );

    if (correo.value.length === 0) {
      feedback.textContent = "";
    } else if (valido) {
      feedback.textContent = "✔ Formato de correo correcto";
      feedback.style.color = "green";
    } else {
      feedback.textContent = "✗ Formato de correo incorrecto";
      feedback.style.color = "red";
    }
  });
}
