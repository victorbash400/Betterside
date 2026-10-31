import { donorSession } from "../../../../server/donor";
import { finishPayPalConnection } from "../../../../server/paypalAccount";
export async function GET(request: Request) {
  const target = new URL("/", request.url);
  target.searchParams.set("profile", "payments");
  try {
    const owner = await donorSession();
    if (!owner) throw new Error("Sign in to link PayPal.");
    await finishPayPalConnection(request, owner);
    target.searchParams.set("paypal", "connected");
  } catch {
    target.searchParams.set("paypal", "failed");
  }
  return Response.redirect(target, 303);
}
