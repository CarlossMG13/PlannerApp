import { auth } from "@clerk/nextjs/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { ok, unauthorized, notFound, badRequest, serverError } from "@/lib/responses";

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = /^image\/(jpeg|jpg|png|webp|gif)$/;
const BUCKET = "portfolio";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: { plannerProfile: true },
  });
  if (!user) return notFound("Usuario no encontrado");
  if (user.role !== "PLANNER") return badRequest("Solo planners pueden subir portfolio");

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return badRequest("Body debe ser multipart/form-data");
  }

  const file = formData.get("file");
  if (!(file instanceof File)) return badRequest("Se requiere un campo 'file'");

  // Validate MIME type server-side (never trust client headers)
  const mime = file.type;
  if (!ALLOWED_MIME_TYPES.test(mime)) {
    return badRequest("Tipo de archivo no permitido. Solo imágenes (jpeg, png, webp, gif).");
  }

  if (file.size > MAX_SIZE_BYTES) {
    return badRequest("El archivo excede el tamaño máximo de 5 MB");
  }

  const ext = mime.split("/")[1] ?? "jpg";
  const filename = `${user.id}/${randomUUID()}.${ext}`;

  const buffer = await file.arrayBuffer();

  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(filename, buffer, {
      contentType: mime,
      upsert: false,
    });

  if (error) {
    console.error("[portfolio/upload] Supabase error:", error.message);
    return serverError("Error al subir el archivo");
  }

  const { data: publicData } = supabaseAdmin.storage
    .from(BUCKET)
    .getPublicUrl(filename);

  return ok({ url: publicData.publicUrl });
}
