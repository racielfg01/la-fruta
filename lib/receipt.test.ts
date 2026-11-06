import { describe, expect, test } from "vitest";
import {
  isReceiptImage,
  receiptFileError,
  receiptUploadErrorMessage,
} from "./receipt";

describe("isReceiptImage", () => {
  test("reconoce una imagen por su MIME", () => {
    expect(isReceiptImage("image/jpeg")).toBe(true);
    expect(isReceiptImage("image/png")).toBe(true);
    expect(isReceiptImage("image/webp")).toBe(true);
    expect(isReceiptImage("image/gif")).toBe(true);
  });

  test("no trata un PDF como imagen", () => {
    expect(isReceiptImage("application/pdf")).toBe(false);
  });

  test("un MIME vacío no es imagen", () => {
    expect(isReceiptImage("")).toBe(false);
  });
});

describe("receiptUploadErrorMessage", () => {
  test("explica cómo resolver un archivo demasiado grande", () => {
    expect(
      receiptUploadErrorMessage({
        code: "TOO_LARGE",
        message: "File is too large",
      }),
    ).toContain("5 MB");
  });

  test("explica qué formatos sí se aceptan", () => {
    expect(
      receiptUploadErrorMessage({
        code: "BAD_REQUEST",
        message: "Invalid file type",
      }),
    ).toContain("JPG");
  });

  test("reconoce el formato inválido que devuelve UploadThing", () => {
    expect(
      receiptUploadErrorMessage({
        code: "BAD_REQUEST",
        message: "Invalid config: InvalidFileType",
      }),
    ).toContain("JPG");
  });

  test("pide volver a iniciar sesión cuando la sesión venció", () => {
    expect(
      receiptUploadErrorMessage({
        code: "FORBIDDEN",
        message: "No autorizado",
      }),
    ).toContain("sesión");
  });

  test("ofrece una salida cuando falla la conexión", () => {
    expect(receiptUploadErrorMessage(new Error("Failed to fetch"))).toContain(
      "conexión",
    );
  });

  test("no expone mensajes técnicos desconocidos", () => {
    const message = receiptUploadErrorMessage({
      code: "INTERNAL_SERVER_ERROR",
      message: "TypeError: fs.writeFile EROFS",
    });
    expect(message).not.toContain("EROFS");
    expect(message).toContain("Inténtalo de nuevo");
  });

  test("reconoce el límite cuando el servidor responde en español", () => {
    expect(
      receiptUploadErrorMessage({
        code: "BAD_REQUEST",
        message: "El archivo supera los 5 MB",
      }),
    ).toContain("5 MB");
  });
});

describe("receiptFileError", () => {
  test("acepta imágenes y PDF de hasta 5 MB", () => {
    for (const type of [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "application/pdf",
    ]) {
      expect(receiptFileError({ type, size: 5 * 1024 * 1024 })).toBeNull();
    }
  });

  test("rechaza un formato no compatible", () => {
    expect(receiptFileError({ type: "image/heic", size: 1024 })).toContain(
      "JPG",
    );
  });

  test("rechaza un archivo de más de 5 MB", () => {
    expect(
      receiptFileError({ type: "image/png", size: 5 * 1024 * 1024 + 1 }),
    ).toContain("5 MB");
  });
});
