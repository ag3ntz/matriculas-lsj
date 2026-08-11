import { test } from "node:test";
import assert from "node:assert/strict";
import { formatearTelefono, validarTelefono } from "./validarTelefono.ts";

test("formatearTelefono conserva solo dígitos y signo +", () => {
  assert.equal(formatearTelefono("+56 9 1234 5678"), "+56912345678");
  assert.equal(formatearTelefono("(56) 9 8765 4321"), "56987654321");
});

test("validarTelefono acepta números móviles chilenos", () => {
  assert.equal(validarTelefono("+56912345678"), true);
  assert.equal(validarTelefono("56912345678"), true);
  assert.equal(validarTelefono("912345678"), true);
});

test("validarTelefono rechaza formatos inválidos", () => {
  assert.equal(validarTelefono("9912345678"), false);
  assert.equal(validarTelefono("+5691234567"), false);
  assert.equal(validarTelefono("712345678"), false);
  assert.equal(validarTelefono("9123456"), false);
  assert.equal(validarTelefono("+56123456789"), false);
  assert.equal(validarTelefono(""), false);
});
