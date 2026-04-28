import { Webhook } from "svix/dist/webhook";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

const VALID_ROLES: Role[] = ["CLIENT", "PLANNER", "VENDOR", "ADMIN"];
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const clerkUserSchema = z.object({
  id: z.string(),
  email_addresses: z.array(z.object({ email_address: z.string() })).min(1),
  first_name: z.string().nullable().optional(),
  last_name: z.string().nullable().optional(),
  unsafe_metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: Request) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[webhook] CLERK_WEBHOOK_SECRET no configurado");
    return new Response("Server misconfiguration", { status: 500 });
  }

  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const payload = await req.text();
  const wh = new Webhook(webhookSecret);

  let event: WebhookEvent;
  try {
    event = wh.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch {
    return new Response("Invalid signature", { status: 401 });
  }

  if (event.type !== "user.created") {
    return new Response("Event ignored", { status: 200 });
  }

  const parsed = clerkUserSchema.safeParse(event.data);
  if (!parsed.success) {
    console.error("[webhook] Payload inválido:", parsed.error.flatten());
    return new Response("Invalid payload", { status: 400 });
  }

  const data = parsed.data;
  const clerkId = data.id;
  const email = data.email_addresses[0].email_address;
  const name = [data.first_name, data.last_name].filter(Boolean).join(" ") || "Usuario";

  // Determine role — admin whitelist takes priority over client claim
  let role: Role = "CLIENT";
  if (ADMIN_EMAILS.includes(email.toLowerCase())) {
    role = "ADMIN";
  } else {
    const claimedRole = (data.unsafe_metadata?.role as string | undefined)
      ?.toUpperCase();
    if (claimedRole && (VALID_ROLES as string[]).includes(claimedRole)) {
      role = claimedRole as Role;
    } else {
      console.warn(`[webhook] Role inválido o ausente para clerkId=${clerkId}, usando CLIENT`);
    }
  }

  try {
    await prisma.user.upsert({
      where: { clerkId },
      create: { clerkId, email, name, role },
      update: {},
    });
    console.log(`[webhook] User upserted clerkId=${clerkId} role=${role}`);
  } catch (err) {
    console.error("[webhook] Error creando user:", err);
    return new Response("Database error", { status: 500 });
  }

  return new Response("OK", { status: 200 });
}
