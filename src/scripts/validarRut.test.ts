import { test } from "node:test";
import assert from "node:assert/strict";
import { limpiarRut, formatearRut, validarRut } from "./validarRut.ts";

test("limpiarRut elimina separadores y convierte a mayúsculas", () => {
  assert.equal(limpiarRut("12.345.678-9"), "123456789");
  assert.equal(limpiarRut("12345678-k"), "12345678K");
  assert.equal(limpiarRut(" 1-2-3-4 "), "1234");
  assert.equal(limpiarRut(""), "");
});

test("formatearRut aplica puntos y guión", () => {
  assert.equal(formatearRut("123456789"), "12.345.678-9");
  assert.equal(formatearRut("9876543k"), "9.876.543-K");
  assert.equal(formatearRut("1"), "1");
});

test("validarRut acepta RUN válidos", () => {
  assert.equal(validarRut("12.345.678-5"), true);
  assert.equal(validarRut("1.111.111-4"), true);
  assert.equal(validarRut("2.222.222-8"), true);
  assert.equal(validarRut("8.765.432-K"), true);
  assert.equal(validarRut("8765432k"), true);
});

test("validarRut rechaza RUN inválidos", () => {
  assert.equal(validarRut("12.345.678-6"), false);
  assert.equal(validarRut("12.345.678-0"), false);
  assert.equal(validarRut("1.111.111-1"), false);
  assert.equal(validarRut("8.765.432-5"), false);
  assert.equal(validarRut("1234567"), false);
  assert.equal(validarRut("abcdefgh"), false);
  assert.equal(validarRut(""), false);
});
