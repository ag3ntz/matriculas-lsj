export function formatearFecha(fecha: string | null | undefined): string {
  if (!fecha) return "";
  const partes = fecha.split("-");
  if (partes.length !== 3) return fecha;
  return `${partes[2]}-${partes[1]}-${partes[0]}`;
}
