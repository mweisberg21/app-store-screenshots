import { NextResponse } from "next/server";
import { accessError, localConfig, sameToken } from "@/lib/local-access";
import { readJson, requestFailure } from "@/lib/request-body";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const error = accessError(req, false);
  if (error) return error;
  try {
    const body = await readJson(req, 256) as { token?: unknown };
    const config = localConfig()!;
    if (!body || typeof body.token !== "string" || !sameToken(body.token, config.token)) {
      return NextResponse.json({ ok: false, error: "Invalid link" }, { status: 401 });
    }
    const response = NextResponse.json({ ok: true });
    response.cookies.set(config.cookie, config.token, { httpOnly: true, sameSite: "strict", path: "/" });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) { return requestFailure(error); }
}
