export class RequestError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export async function readJson(req: Request, maxBytes: number): Promise<unknown> {
  if (req.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
    throw new RequestError(415, "Use application/json");
  }
  if (req.headers.has("content-encoding") && req.headers.get("content-encoding") !== "identity") {
    throw new RequestError(415, "Compressed request bodies are not supported");
  }
  const length = req.headers.get("content-length");
  if (length && (!/^\d+$/.test(length) || Number(length) > maxBytes)) throw new RequestError(413, "Request too large");
  const reader = req.body?.getReader();
  if (!reader) throw new RequestError(400, "Missing JSON body");
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => { reject(new RequestError(408, "Request timed out")); void reader.cancel().catch(() => {}); }, 10_000);
  });
  try {
    while (true) {
      const { done, value } = await Promise.race([reader.read(), timeout]);
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBytes) { void reader.cancel().catch(() => {}); throw new RequestError(413, "Request too large"); }
      chunks.push(value);
    }
    const body = new Uint8Array(bytes);
    let offset = 0;
    for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.length; }
    try { return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(body)); }
    catch { throw new RequestError(400, "Invalid JSON"); }
  } finally { clearTimeout(timer!); reader.releaseLock(); }
}

export function requestFailure(error: unknown) {
  return Response.json({ ok: false, error: error instanceof RequestError ? error.message : "The request could not be saved." }, { status: error instanceof RequestError ? error.status : 500 });
}
