import { board, receipt, failure } from "@/features/voting/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    const hash = new URL(request.url).searchParams.get("receipt");
    return Response.json(hash ? await receipt(hash) : await board(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    return failure(e);
  }
}
