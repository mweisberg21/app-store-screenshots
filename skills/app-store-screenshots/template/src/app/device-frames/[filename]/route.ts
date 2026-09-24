import { readFile } from "node:fs/promises";
import path from "node:path";
import { APPLE_FRAMES } from "@/lib/apple-frames";
import { accessError } from "@/lib/local-access";

export const dynamic = "force-dynamic";

export async function GET(req: Request, context: { params: Promise<{ filename: string }> }) {
  const denied = accessError(req);
  if (denied) return denied;
  const { filename } = await context.params;
  if (!Object.values(APPLE_FRAMES).some((frame) => frame.filename === filename)) {
    return new Response("Unknown frame", { status: 404 });
  }
  try {
    const bytes = await readFile(path.join(process.cwd(), "public/device-frames", filename));
    return new Response(new Uint8Array(bytes), { headers: {
      "Content-Type": "image/png", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff",
    } });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return new Response("Import the Apple frame files first", { status: 404 });
    return new Response("Could not read the frame", { status: 500 });
  }
}
