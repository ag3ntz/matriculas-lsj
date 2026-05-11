export function validarCorreo() {
    const correo = document.querySelector('input[name="correoApoderado"]');

    if (!correo) return;

    correo.addEventListener("input", () => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        const valido = regex.test(correo.value);

        correo.classList.toggle("input-valido", valido);
        correo.classList.toggle("input-invalido", !valido);
    });
}