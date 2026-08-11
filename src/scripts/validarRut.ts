export function limpiarRut(rut: string): string {
  return rut.replace(/[^0-9kK]/g, "").toUpperCase();
}

export function formatearRut(rut: string): string {
  rut = limpiarRut(rut);

  if (rut.length <= 1) return rut;

  const cuerpo = rut.slice(0, -1);
  const dv = rut.slice(-1);
  let cuerpoFormateado = "";

  let i = cuerpo.length;
  while (i > 3) {
    cuerpoFormateado = "." + cuerpo.slice(i - 3, i) + cuerpoFormateado;
    i -= 3;
  }
  cuerpoFormateado = cuerpo.slice(0, i) + cuerpoFormateado;

  return cuerpoFormateado + "-" + dv;
}

export function validarRut(rut: string): boolean {
  rut = limpiarRut(rut);
  if (rut.length < 8) return false;

  const cuerpo = rut.slice(0, -1);
  const dv = rut.slice(-1).toUpperCase();

  let suma = 0;
  let multiplo = 2;

  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo.charAt(i)) * multiplo;
    multiplo = multiplo < 7 ? multiplo + 1 : 2;
  }

  let dvEsperado: string | number = 11 - (suma % 11);
  dvEsperado =
    dvEsperado === 11 ? "0" : dvEsperado === 10 ? "K" : dvEsperado.toString();

  return dv === dvEsperado;
}
