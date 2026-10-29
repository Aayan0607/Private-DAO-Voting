import {
  checkOrigin,
  jsonBody,
  exclusive,
  relay,
  failure,
} from "@/features/voting/server";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const body = await jsonBody(request);
    return Response.json(await exclusive(() => relay(body)));
  } catch (e) {
    return failure(e);
  }
}
