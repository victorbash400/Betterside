import { z } from "zod";
import { loadOrganizationDirectory } from "../../server/organizationDirectory";
import { cachedResponse } from "../../server/cachedResponse";
import { apiError } from "../../server/http";
export const maxDuration = 120;
const query = z.object({
  refresh: z.literal("1").optional(),
  country: z
    .string()
    .length(3)
    .refine((value) =>
      [...value].every((char) => "ABCDEFGHIJKLMNOPQRSTUVWXYZ".includes(char)),
    )
    .optional(),
});
export async function GET(request: Request) {
  const result = query.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  if (!result.success) return apiError(new Error("Invalid country filter."));
  try {
    return cachedResponse(
      request,
      await loadOrganizationDirectory(
        result.data.country,
        result.data.refresh === "1",
      ),
      60,
    );
  } catch (error) {
    const response = apiError(error, 503);
    response.headers.set("Cache-Control", "no-store");
    return response;
  }
}
