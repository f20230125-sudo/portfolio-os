// Answers when the server is up. Used by the Docker health check and by tests.
export function GET() {
  return Response.json({ ok: true });
}
