function doGet() {
  return ContentService.createTextOutput(
    JSON.stringify({ estado: "OK", mensaje: "Web App activa" }),
  ).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) {
    return respond({
      estado: "ERROR",
      mensaje: "El sistema está ocupado. Intente nuevamente en unos segundos.",
    });
  }

  try {
    const data = parseData(e);

    const errores = validarDatos(data);
    if (errores.length > 0) {
      return respond({
        estado: "ERROR",
        mensaje: "Datos inválidos: " + errores.join("; "),
      });
    }

    if (!verificarReCaptcha(data)) {
      return respond({
        estado: "ERROR",
        mensaje:
          "No se pudo verificar la solicitud. Recargue la página e intente nuevamente.",
      });
    }

    const sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName(
      CONFIG.SHEET_NAME,
    );

    const headers = getHeaders();
    ensureHeaders(sheet, headers);

    const rutColIndex = headers.indexOf("rutAlumno") + 1;
    const existingRow = findRowByRut(sheet, rutColIndex, data.rutAlumno);

    const isForce = data.force === true || data.force === "true";

    if (existingRow && !isForce) {
      return respond({
        estado: "DUPLICATE",
        mensaje:
          "El RUN del alumno ya fue registrado. ¿Desea reemplazar el registro anterior?",
      });
    }

    if (existingRow && isForce) {
      replaceRow(sheet, headers, existingRow, data);
    } else {
      appendRow(sheet, headers, data);
    }

    const pdfFile = generatePDF(data);
    const courseFolder = getOrCreateCourseFolder(data.cursoMatricula);
    courseFolder.addFile(pdfFile);
    DriveApp.getFolderById(CONFIG.PARENT_FOLDER_ID).removeFile(pdfFile);

    const pdfUrl = pdfFile.getUrl();
    const pdfColIndex = headers.indexOf("pdfUrl") + 1;
    const row = existingRow || findRowByRut(sheet, rutColIndex, data.rutAlumno);
    if (row) {
      sheet.getRange(row, pdfColIndex).setValue(pdfUrl);
    }

    return respond({
      estado: "OK",
      pdfUrl: pdfUrl,
      fileName: pdfFile.getName(),
    });
  } catch (err) {
    console.error("doPost error:", err);
    return respond({ estado: "ERROR", mensaje: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

function parseData(e) {
  if (e.postData && e.postData.contents) {
    try {
      return JSON.parse(e.postData.contents);
    } catch (_) {}
  }
  const data = {};
  if (e.parameter) {
    for (const key in e.parameter) {
      data[key] = e.parameter[key];
    }
  }
  if (data.force === "true") data.force = true;
  return data;
}

function getRecaptchaSecret() {
  const prop =
    PropertiesService.getScriptProperties().getProperty("RECAPTCHA_SECRET");
  return prop || CONFIG.RECAPTCHA_SECRET || "";
}

function verificarReCaptcha(data) {
  const secret = getRecaptchaSecret();
  if (!secret) return true;

  const token = String(data.recaptchaToken || "");
  if (!token) {
    return !CONFIG.REQUIRE_RECAPTCHA;
  }

  try {
    const res = UrlFetchApp.fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "post",
        payload: { secret: secret, response: token },
        muteHttpExceptions: true,
      },
    );
    const json = JSON.parse(res.getContentText());
    if (json.success !== true) return false;
    if (
      typeof json.score === "number" &&
      json.score < CONFIG.RECAPTCHA_MIN_SCORE
    )
      return false;
    return true;
  } catch (err) {
    console.error("reCAPTCHA verification error:", err);
    return false;
  }
}

function validarRutGAS(rut) {
  const limpio = String(rut || "")
    .replace(/[^0-9kK]/g, "")
    .toUpperCase();
  if (limpio.length < 8) return false;

  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1);

  let suma = 0;
  let multiplo = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo.charAt(i), 10) * multiplo;
    multiplo = multiplo < 7 ? multiplo + 1 : 2;
  }

  const resto = 11 - (suma % 11);
  const dvEsperado = resto === 11 ? "0" : resto === 10 ? "K" : resto.toString();
  return dv === dvEsperado;
}

function validarCorreoGAS(correo) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(correo || "").trim());
}

function validarTelefonoGAS(telefono) {
  const limpio = String(telefono || "").replace(/[^+\d]/g, "");
  return /^(\+?56)?9\d{8}$/.test(limpio);
}

function validarDatos(data) {
  const errores = [];

  const camposObligatorios = [
    "cursoMatricula",
    "rutAlumno",
    "nombresAlumno",
    "apellidoPaterno",
    "apellidoMaterno",
    "fechaNacimiento",
    "edad",
    "sexo",
    "nacionalidad",
    "domicilio",
    "comuna",
    "region",
    "viveCon",
    "programaSocial",
    "etnia",
    "repiteCurso",
    "claseReligion",
    "colegioProcedencia",
    "sae",
    "rutApoderado",
    "nombreApoderado",
    "fechaNacApoderado",
    "telefonoApoderado",
    "correoApoderado",
    "domicilioApoderado",
    "comunaApoderado",
    "escolaridadApoderado",
    "profesionApoderado",
    "rutPadre",
    "nombrePadre",
    "fechaNacPadre",
    "domicilioPadre",
    "comunaPadre",
    "profesionPadre",
    "escolaridadPadre",
    "rutMadre",
    "nombreMadre",
    "fechaNacMadre",
    "domicilioMadre",
    "comunaMadre",
    "profesionMadre",
    "escolaridadMadre",
    "tratamientoMedico",
    "programaEscolar",
    "trastornoAprendizaje",
    "alergiaMed",
    "contraMedica",
    "prevision",
    "movEscolar",
    "nombreSuplente",
    "rutSuplente",
    "parentescoSuplente",
  ];

  for (const campo of camposObligatorios) {
    if (!data[campo] || !String(data[campo]).trim()) {
      errores.push("'" + campo + "' es obligatorio");
    }
  }

  const ruts = [
    "rutAlumno",
    "rutApoderado",
    "rutPadre",
    "rutMadre",
    "rutSuplente",
  ];
  for (const campo of ruts) {
    if (data[campo] && !validarRutGAS(data[campo])) {
      errores.push("RUN inválido en '" + campo + "'");
    }
  }

  if (data.correoApoderado && !validarCorreoGAS(data.correoApoderado)) {
    errores.push("Correo del apoderado inválido");
  }

  if (data.telefonoApoderado && !validarTelefonoGAS(data.telefonoApoderado)) {
    errores.push("Teléfono del apoderado inválido");
  }

  const condicionalesMantener = [
    { select: "programaSocial", detail: "programaSocialDetalle" },
    { select: "etnia", detail: "etniaDetalle" },
    { select: "tratamientoMedico", detail: "tratamientoMedicoDetalle" },
    { select: "programaEscolar", detail: "programaEscolarDetalle" },
    { select: "alergiaMed", detail: "alergiaMedDetalle" },
    { select: "contraMedica", detail: "contraMedicaDetalle" },
    { select: "movEscolar", detail: "movEscolarDetalle" },
  ];

  for (const cond of condicionalesMantener) {
    const detalle = String(data[cond.detail] || "").trim();
    if (data[cond.select] === "Si" && (!detalle || detalle === "------")) {
      errores.push("Debe especificar '" + cond.detail + "'");
    }
  }

  return errores;
}

function getHeaders() {
  return [
    "timestamp",
    "cursoMatricula",
    "rutAlumno",
    "nombresAlumno",
    "apellidoPaterno",
    "apellidoMaterno",
    "fechaNacimiento",
    "edad",
    "sexo",
    "nacionalidad",
    "otraNacionalidad",
    "domicilio",
    "comuna",
    "region",
    "viveCon",
    "otraVivecon",
    "programaSocial",
    "programaSocialDetalle",
    "etnia",
    "etniaDetalle",
    "repiteCurso",
    "claseReligion",
    "colegioProcedencia",
    "otroColegio",
    "sae",
    "rutApoderado",
    "nombreApoderado",
    "fechaNacApoderado",
    "telefonoApoderado",
    "correoApoderado",
    "domicilioApoderado",
    "comunaApoderado",
    "escolaridadApoderado",
    "profesionApoderado",
    "rutPadre",
    "nombrePadre",
    "fechaNacPadre",
    "domicilioPadre",
    "comunaPadre",
    "profesionPadre",
    "escolaridadPadre",
    "rutMadre",
    "nombreMadre",
    "fechaNacMadre",
    "domicilioMadre",
    "comunaMadre",
    "profesionMadre",
    "escolaridadMadre",
    "tratamientoMedico",
    "tratamientoMedicoDetalle",
    "programaEscolar",
    "programaEscolarDetalle",
    "trastornoAprendizaje",
    "alergiaMed",
    "alergiaMedDetalle",
    "contraMedica",
    "contraMedicaDetalle",
    "prevision",
    "movEscolar",
    "movEscolarDetalle",
    "nombreSuplente",
    "rutSuplente",
    "parentescoSuplente",
    "pdfUrl",
  ];
}

function ensureHeaders(sheet, headers) {
  if (sheet.getLastRow() > 0) return;
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
}

function findRowByRut(sheet, colIndex, rut) {
  if (!rut || sheet.getLastRow() <= 1) return null;
  const data = sheet
    .getRange(2, colIndex, sheet.getLastRow() - 1, 1)
    .getValues();
  for (let i = 0; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(rut).trim()) {
      return i + 2;
    }
  }
  return null;
}

function buildRowData(headers, data) {
  const row = [];
  row.push(new Date().toISOString());
  for (let i = 1; i < headers.length; i++) {
    row.push(data[headers[i]] || "");
  }
  return row;
}

function appendRow(sheet, headers, data) {
  const row = buildRowData(headers, data);
  sheet.appendRow(row);
}

function replaceRow(sheet, headers, rowIndex, data) {
  const row = buildRowData(headers, data);
  sheet.getRange(rowIndex, 1, 1, headers.length).setValues([row]);
}

function generatePDF(data) {
  const templateFile = DriveApp.getFileById(CONFIG.TEMPLATE_DOC_ID);
  const cleanRut = String(data.rutAlumno || "").replace(/[^0-9kK-]/g, "");
  const anioMatricula = new Date().getFullYear() + 1;
  const fileName =
    `${cleanRut}_${data.apellidoPaterno || ""}_${data.nombresAlumno || ""}_${anioMatricula}`.replace(
      /\s+/g,
      "_",
    );

  const copyFile = templateFile.makeCopy(fileName);
  const doc = DocumentApp.openById(copyFile.getId());
  const body = doc.getBody();

  for (const [key, value] of Object.entries(data)) {
    body.replaceText(`{{${key}}}`, String(value || ""));
  }

  doc.saveAndClose();

  const pdfBlob = copyFile.getAs("application/pdf");
  const pdfFile = DriveApp.createFile(pdfBlob).setName(fileName + ".pdf");

  copyFile.setTrashed(true);

  return pdfFile;
}

function getOrCreateCourseFolder(curso) {
  const parent = DriveApp.getFolderById(CONFIG.PARENT_FOLDER_ID);
  const folders = parent.getFolders();
  while (folders.hasNext()) {
    const folder = folders.next();
    if (folder.getName() === curso) {
      return folder;
    }
  }
  return parent.createFolder(curso);
}

function respond(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
