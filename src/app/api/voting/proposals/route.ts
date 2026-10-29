import {
  checkOrigin,
  jsonBody,
  exclusive,
  publish,
  failure,
} from "@/features/voting/server";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    checkOrigin(request, true);
    const body = await jsonBody(request);
    return Response.json(await exclusive(() => publish(body)));
  } catch (e) {
    return failure(e);
  }
}
