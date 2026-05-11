//document.addEventListener("DOMContentLoaded", () => {
//    document.addEventListener("input", function (e) {
//        if (
//            [
//               "nombresAlumno",
//               "apellidoPaterno",
//               "apellidoMaterno",
//               "nombreApoderado",
//               "nombrePadre",
//               "nombreMadre",
//               "nombreSuplente"
//            ].includes(e.target.id)
//        ) {
//            e.target.value = e.target.value
//                .toLowerCase()
//                .replace(/(^\p{L}|\s\p{L})/gu, l => l.toUpperCase());
//        }
//    });
//});

export function inicializarFormateoNombres() {
    document.addEventListener("input", function (e) {
        if (
            [
                "nombresAlumno",
                "apellidoPaterno",
                "apellidoMaterno",
                "nombreApoderado",
                "nombrePadre",
                "nombreMadre",
                "nombreSuplente"
            ].includes(e.target.id)
        ) {
            e.target.value = e.target.value
                .toLowerCase()
                .replace(/(^\p{L}|\s\p{L})/gu, l => l.toUpperCase());
        }
    });
}