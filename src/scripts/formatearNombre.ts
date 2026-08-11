export function inicializarFormateoNombres(): void {
  document.addEventListener("input", (e) => {
    const target = e.target;
    if (!(target instanceof HTMLInputElement)) return;

    if (
      [
        "nombresAlumno",
        "apellidoPaterno",
        "apellidoMaterno",
        "nombreApoderado",
        "nombrePadre",
        "nombreMadre",
        "nombreSuplente",
        "parentescoSuplente",
      ].includes(target.id)
    ) {
      target.value = target.value
        .toLowerCase()
        .replace(/(^\p{L}|\s\p{L})/gu, (l) => l.toUpperCase());
    }
  });
}
