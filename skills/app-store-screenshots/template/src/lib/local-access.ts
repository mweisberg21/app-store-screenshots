// Shared by middleware and route handlers. Never import the token into client code.
export function localConfig() {
  const token = process.env.SCREENSHOT_EDITOR_TOKEN;
  const origin = process.env.SCREENSHOT_EDITOR_ORIGIN;
  if (!token || !/^[a-f0-9]{64}$/.test(token) || !origin) return null;
  try {
    const url = new URL(origin);
    if (url.protocol !== "http:" || url.hostname !== "127.0.0.1" || url.origin !== origin) return null;
    return { token, origin, host: url.host, cookie: `screenshot_editor_${url.port}` };
  } catch { return null; }
}

export function sameToken(actual: string, expected: string) {
  if (actual.length !== expected.length) return false;
  let difference = 0;
  for (let i = 0; i < expected.length; i++) difference |= actual.charCodeAt(i) ^ expected.charCodeAt(i);
  return difference === 0;
}

export function accessError(req: Request, requireSession = true): Response | null {
  const config = localConfig();
  if (!config) return Response.json({ ok: false, error: "Start the editor with npm run dev or npm start." }, { status: 503 });
  // Do not trust forwarded host headers. This editor is not a network service.
  if (req.headers.get("host") !== config.host) return Response.json({ ok: false, error: "Invalid host" }, { status: 403 });
  if (!["GET", "HEAD"].includes(req.method) && req.headers.get("origin") !== config.origin) {
    return Response.json({ ok: false, error: "Invalid origin" }, { status: 403 });
  }
  if (requireSession) {
    const cookie = (req.headers.get("cookie") || "").split(";").map((part) => part.trim()).find((part) => part.startsWith(`${config.cookie}=`));
    const value = cookie?.slice(config.cookie.length + 1) || "";
    if (!sameToken(value, config.token)) return Response.json({ ok: false, error: "Open the private link printed by the editor server." }, { status: 401 });
  }
  return null;
}

export const UNLOCK_HTML = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="referrer" content="no-referrer"><title>Open screenshot editor</title><body><p id="status">Opening the editor…</p><script>
const token = location.hash.slice(1);
history.replaceState(null, '', '/unlock');
if (!/^[a-f0-9]{64}$/.test(token)) {
  document.getElementById('status').textContent = 'Open the private link printed in your editor terminal.';
} else {
  fetch('/api/session', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({token})})
    .then(response => { if (!response.ok) throw new Error(); location.replace('/'); })
    .catch(() => { document.getElementById('status').textContent = 'This link has expired. Open the current link from your editor terminal.'; });
}
</script></body></html>`;
