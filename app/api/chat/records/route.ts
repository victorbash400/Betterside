import { z } from "zod";
import { loadCatalogue } from "../../../server/catalogue";
import { loadDiscovery } from "../../../server/discovery";
import { loadTracking } from "../../../server/tracking";
import { donorSession } from "../../../server/donor";
import { sameOrigin, apiError } from "../../../server/http";
import { saveRecordsSchema } from "../../../lib/chatWorkspace";
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const { recordIds } = z
      .object({ recordIds: saveRecordsSchema.shape.recordIds })
      .strict()
      .parse(await request.json());
    const donor = await donorSession();
    const [catalogue, discovery, tracking] = await Promise.all([
      loadCatalogue(),
      loadDiscovery(),
      donor ? loadTracking(donor) : Promise.resolve({ snapshot: null }),
    ]);
    const ids = new Set(recordIds);
    if (ids.size !== recordIds.length) throw new Error("Duplicate record IDs.");
    const source = new Map(
      [
        ...(tracking.snapshot?.savedItems ?? []),
        ...catalogue,
        ...discovery.issues,
      ].map((record) => [record.id, record]),
    );
    const records = recordIds.map((id) => {
      const record = source.get(id);
      if (!record)
        throw new Error("Record unavailable. Refresh data and search again.");
      return record;
    });
    return Response.json(
      { records },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}
