import { accessError } from "@/lib/local-access";
import { readJson, requestFailure, RequestError } from "@/lib/request-body";
import { MAX_UPLOAD_BODY, parseImage, saveImage } from "@/lib/upload-storage";

export const dynamic = "force-dynamic";
let windowStarted = 0;
let attempts = 0;
let inFlight = 0;

export async function POST(req: Request) {
  const error = accessError(req);
  if (error) return error;
  if (Date.now() - windowStarted >= 60_000) { windowStarted = Date.now(); attempts = 0; }
  if (++attempts > 60 || inFlight >= 4) return requestFailure(new RequestError(429, "Too many uploads. Try again shortly."));
  inFlight++;
  try {
    const body = await readJson(req, MAX_UPLOAD_BODY) as { dataUrl?: unknown };
    const image = parseImage(body?.dataUrl);
    const path = await saveImage(process.cwd(), image);
    return Response.json({ ok: true, path });
  } catch (error) { return requestFailure(error); }
  finally { inFlight--; }
}
