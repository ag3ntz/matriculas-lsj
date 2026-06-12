function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ status: "OK", message: "Web App activa" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    const data = parseData(e);
    const sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID)
      .getSheetByName(CONFIG.SHEET_NAME);

    const headers = getHeaders();
    ensureHeaders(sheet, headers);

    const rutColIndex = headers.indexOf("rutAlumno") + 1;
    const existingRow = findRowByRut(sheet, rutColIndex, data.rutAlumno);

    const isForce = data.force === true || data.force === "true";

    if (existingRow && !isForce) {
      return respond({ status: "DUPLICATE", message: "El RUN del alumno ya fue registrado. ¿Desea reemplazar el registro anterior?" });
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
      status: "OK",
      pdfUrl: pdfUrl,
      fileName: pdfFile.getName(),
    });

  } catch (err) {
    return respond({ status: "ERROR", message: err.toString() });
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

function getHeaders() {
  return [
    "timestamp", "cursoMatricula",
    "rutAlumno", "nombresAlumno", "apellidoPaterno", "apellidoMaterno",
    "fechaNacimiento", "edad", "sexo", "nacionalidad", "otraNacionalidad",
    "domicilio", "comuna", "region",
    "viveCon", "otraVivecon", "programaSocial", "otraProgramaSocial", "etnia", "otraEtnia",
    "repiteCurso", "claseReligion", "colegioProcedencia", "otroColegio", "SAE",
    "rutApoderado", "nombreApoderado", "fechaNacApoderado",
    "telefonoApoderado", "correoApoderado",
    "domicilioApoderado", "comunaApoderado",
    "escolaridadApoderado", "profesionApoderado",
    "rutPadre", "nombrePadre", "fechaNacPadre",
    "domicilioPadre", "comunaPadre", "profesionPadre", "escolaridadPadre",
    "rutMadre", "nombreMadre", "fechaNacMadre",
    "domicilioMadre", "comunaMadre", "profesionMadre", "escolaridadMadre",
    "tratamientoMedico", "defTratMedico", "programaEscolar", "defProgramaEscolar", "trast_aprendizaje",
    "alergiaMed", "defAlergiaMed", "contraMedica", "defContraMedica", "prevision",
    "movEscolar", "defMovEscolar",
    "nombreSuplente", "rutSuplente", "parentescoSuplente",
    "pdfUrl",
  ];
}

function ensureHeaders(sheet, headers) {
  if (sheet.getLastRow() > 0) return;
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
}

function findRowByRut(sheet, colIndex, rut) {
  if (!rut || sheet.getLastRow() <= 1) return null;
  const data = sheet.getRange(2, colIndex, sheet.getLastRow() - 1, 1).getValues();
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
  const fileName = `${cleanRut}_${data.apellidoPaterno || ""}_${data.nombresAlumno || ""}_2027`.replace(/\s+/g, "_");

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
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
