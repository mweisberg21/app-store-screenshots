import { constants, promises as fs } from "node:fs";
import path from "node:path";
import { accessError } from "@/lib/local-access";
import { MAX_IMAGE_BYTES } from "@/lib/upload-storage";

export const dynamic = "force-dynamic";

// Next's production static-file inventory does not include images uploaded after startup.
export async function GET(req: Request, context: { params: Promise<{ filename: string }> }) {
  const error = accessError(req);
  if (error) return error;
  const { filename } = await context.params;
  if (!/^(?:[a-f0-9]{16}|[a-f0-9]{64})\.(png|jpg)$/.test(filename)) return new Response(null, { status: 404 });
  let file;
  try {
    file = await fs.open(path.join(process.cwd(), "public/screenshots/uploaded", filename), constants.O_RDONLY | constants.O_NOFOLLOW);
    const stat = await file.stat();
    if (!stat.isFile() || stat.size > MAX_IMAGE_BYTES) return new Response(null, { status: 404 });
    return new Response(new Uint8Array(await file.readFile()), {
      headers: { "Content-Type": filename.endsWith(".png") ? "image/png" : "image/jpeg", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
    });
  } catch { return new Response(null, { status: 404 }); }
  finally { await file?.close(); }
}
