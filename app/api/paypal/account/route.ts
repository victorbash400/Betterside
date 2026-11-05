import { donorSession } from "../../../server/donor";
import { apiError, sameOrigin } from "../../../server/http";
import {
  paypalAccountStatus,
  beginPayPalConnection,
  disconnectPayPalAccount,
} from "../../../server/paypalAccount";
export async function GET() {
  try {
    const owner = await donorSession();
    if (!owner) return apiError(new Error("Sign in to connect PayPal."), 401);
    return Response.json(await paypalAccountStatus(owner), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (failure) {
    return apiError(failure);
  }
}
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const owner = await donorSession();
    if (!owner) return apiError(new Error("Sign in to connect PayPal."), 401);
    return Response.json({
      url: await beginPayPalConnection(owner, new URL(request.url).origin),
    });
  } catch (failure) {
    return apiError(failure);
  }
}
export async function DELETE(request: Request) {
  try {
    sameOrigin(request);
    const owner = await donorSession();
    if (!owner) return apiError(new Error("Sign in to manage PayPal."), 401);
    await disconnectPayPalAccount(owner);
    return Response.json({ connected: false });
  } catch (failure) {
    return apiError(failure);
  }
}
