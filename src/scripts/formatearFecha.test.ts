import { test } from "node:test";
import assert from "node:assert/strict";
import { formatearFecha } from "./formatearFecha.ts";

test("formatearFecha convierte YYYY-MM-DD a DD-MM-YYYY", () => {
  assert.equal(formatearFecha("2027-03-15"), "15-03-2027");
  assert.equal(formatearFecha("2027-3-5"), "5-3-2027");
});

test("formatearFecha invierte cualquier fecha de 3 partes separadas por guiones", () => {
  assert.equal(formatearFecha("15-03-2027"), "2027-03-15");
  assert.equal(formatearFecha("2027-03-15"), "15-03-2027");
});

test("formatearFecha maneja valores vacíos", () => {
  assert.equal(formatearFecha(""), "");
  assert.equal(formatearFecha(undefined), "");
  assert.equal(formatearFecha(null), "");
});
