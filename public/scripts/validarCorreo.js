export function validarCorreo() {
  const correo = document.querySelector('input[name="correoApoderado"]');

  if (!correo) return;

  const feedback = document.createElement("div");
  feedback.classList.add("correoFeedback");
  correo.insertAdjacentElement("afterend", feedback);

  correo.addEventListener("input", () => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const valido = regex.test(correo.value);

    correo.classList.toggle("input-valido", valido);
    correo.classList.toggle("input-invalido", !valido && correo.value.length > 0);

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
