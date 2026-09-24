import { promises as fs } from "node:fs";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { accessError } from "@/lib/local-access";
import { projectSchema } from "@/lib/project-schema";
import { readJson, requestFailure, RequestError } from "@/lib/request-body";

export const dynamic = "force-dynamic";
const filePath = () => path.join(process.cwd(), "app-store-screenshots.json");
let saving = false;

export async function GET(req: Request) {
  const error = accessError(req);
  if (error) return error;
  try {
    // Client migration supplies schema v2 when an old file is next saved.
    const state = JSON.parse(await fs.readFile(filePath(), "utf8"));
    return Response.json({ ok: true, state }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return Response.json({ ok: true, state: null });
    return requestFailure(error);
  }
}

export async function POST(req: Request) {
  const error = accessError(req);
  if (error) return error;
  if (saving) return requestFailure(new RequestError(409, "Another save is in progress. Try again."));
  saving = true;
  let temporary: string | undefined;
  try {
    const body = await readJson(req, 4 * 1024 * 1024);
    const parsed = projectSchema.safeParse(body);
    if (!parsed.success) throw new RequestError(400, "Invalid project data");
    temporary = `${filePath()}.${randomUUID()}.tmp`;
    await fs.writeFile(temporary, JSON.stringify(parsed.data, null, 2) + "\n", { flag: "wx", mode: 0o600 });
    await fs.rename(temporary, filePath());
    return Response.json({ ok: true });
  } catch (error) { return requestFailure(error); }
  finally { if (temporary) await fs.unlink(temporary).catch(() => {}); saving = false; }
}
