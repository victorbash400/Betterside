import { z } from "zod";
import { chatRecordSchema } from "../lib/chatWorkspace";
export async function fetchChatRecords(request: typeof fetch, recordIds: string[]) {
  const response = await request("/api/chat/records", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recordIds }),
  });
  const body: unknown = await response.json();
  if (!response.ok) throw new Error(z.object({ error: z.string() }).parse(body).error);
  return z.object({ records: z.array(chatRecordSchema) }).parse(body).records;
}
