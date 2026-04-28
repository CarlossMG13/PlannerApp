import { NextResponse } from "next/server";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function unauthorized(message = "No autorizado") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbidden(message = "Acceso denegado") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function notFound(message = "No encontrado") {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function serverError(message = "Error interno del servidor") {
  return NextResponse.json({ error: message }, { status: 500 });
}
