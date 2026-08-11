import { test } from "node:test";
import assert from "node:assert/strict";
import { esCorreoValido } from "./validarCorreo.ts";

test("esCorreoValido acepta correos con formato válido", () => {
  assert.equal(esCorreoValido("correo@dominio.cl"), true);
  assert.equal(esCorreoValido("nombre.apellido@sub.dominio.cl"), true);
  assert.equal(esCorreoValido("a@b.c"), true);
});

test("esCorreoValido rechaza correos inválidos", () => {
  assert.equal(esCorreoValido("correo@dominio"), false);
  assert.equal(esCorreoValido("@dominio.cl"), false);
  assert.equal(esCorreoValido("correo@.cl"), false);
  assert.equal(esCorreoValido("correo dominio.cl"), false);
  assert.equal(esCorreoValido(""), false);
  assert.equal(esCorreoValido(null), false);
});
