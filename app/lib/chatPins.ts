import { interestPath } from "./interestTree.ts";
import { z } from "zod";
import { concerns } from "./concerns.ts";
import { pinCountries, samePinTarget } from "./pins.ts";
import { pinTargetSchema, trackingSchema, type Tracking } from "./tracking.ts";
import type { DirectoryOrganization } from "./organizations.ts";
import type { MapItem } from "./types.ts";

export const chatPinTargetSchema = z.union([
  pinTargetSchema,
  z.object({ kind: z.literal("record"), recordId: z.string().min(1).max(160) }),
]);
export const pinItemsSchema = z.object({ targets: z.array(chatPinTargetSchema).min(1).max(20) });
export const unpinItemsSchema = z.object({ ids: z.array(z.string().min(1).max(160)).min(1).max(20) });
export const chatPinSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["country", "scope", "cause", "organization", "record", "folder"]),
  target: pinTargetSchema.optional(),
  recordId: z.string().optional(),
});
export const pinsResultSchema = z.object({
  kind: z.literal("pins"),
  action: z.enum(["listed", "pinned", "unpinned"]),
  pins: z.array(chatPinSchema),
  changed: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
  nextOffset: z.number().int().nullable(),
});
export type PinsResult = z.infer<typeof pinsResultSchema>;
export type PinItemsInput = z.infer<typeof pinItemsSchema>;
export type UnpinItemsInput = z.infer<typeof unpinItemsSchema>;

export function chatPins(snapshot: Tracking, records: MapItem[]): PinsResult["pins"] {
  const grouped = new Set(snapshot.interests.filter((pin) => !pin.archived).flatMap((pin) => pin.issueIds));
  return [
    ...snapshot.interests.filter((pin) => !pin.archived).map((pin) => ({
      id: pin.id, name: pin.name, type: pin.target?.kind ?? "folder" as const, target: pin.target,
    })),
    ...snapshot.following.filter((id) => !grouped.has(id)).map((id) => {
      const record = records.find((record) => record.id === id) ?? snapshot.savedItems.find((record) => record.id === id);
      return { id, name: record?.project?.name ?? record?.location ?? id, type: "record" as const, recordId: id };
    }),
  ];
}

export function pinChatItems(previous: Tracking, records: MapItem[], raw: PinItemsInput, callId: string, organizations: DirectoryOrganization[] = []) {
  const input = pinItemsSchema.parse(raw);
  const snapshot = structuredClone(previous);
  const countries = pinCountries(records);
  let changed = 0;
  const selectedIds = new Set<string>();
  for (const [index, requested] of input.targets.entries()) {
    if (requested.kind === "record") {
      const record = records.find((record) => record.id === requested.recordId);
      if (!record) throw new Error("Record unavailable. Search records again.");
      selectedIds.add(record.id);
      if (!snapshot.following.includes(record.id)) { snapshot.following.push(record.id); changed++; }
      snapshot.savedItems = [...snapshot.savedItems.filter((item) => item.id !== record.id), record];
      continue;
    }
    let target = requested;
    let name: string;
    if (requested.kind === "country" || requested.kind === "scope") {
      const country = countries.find((country) => country.countryCode === requested.countryCode);
      if (!country) throw new Error("Country unavailable. Search records again.");
      target = { ...target, ...country };
      name = requested.kind === "scope" ? `${concerns.find((cause) => cause.id === requested.concern)!.label} · ${country.country}` : country.country;
    } else if (requested.kind === "cause") {
      name = concerns.find((cause) => cause.id === requested.concern)!.label;
    } else {
      const organization = organizations.find((org) => org.id === requested.organizationId);
      if (!organization) throw new Error("Organization unavailable. Search organizations again.");
      const country = requested.countryCode ? countries.find((country) => country.countryCode === requested.countryCode) : undefined;
      if (requested.countryCode && (!country || !organization.presence.some((area) => area.countryCode === requested.countryCode)))
        throw new Error("Organization has no reported presence in that country.");
      target = { kind: "organization", organizationId: organization.id, ...country };
      name = country ? `${organization.name} · ${country.country}` : organization.name;
    }
    const existing = snapshot.interests.find((pin) => !pin.archived && samePinTarget(pin.target, target));
    if (existing) { selectedIds.add(existing.id); continue; }
    const id = `${callId}:${index}`;
    selectedIds.add(id);
    snapshot.interests.push({ id, name, target, hiddenKinds: [], issueIds: [] });
    changed++;
  }
  const savedPins = chatPins(snapshot, records);
  const pins = [...selectedIds].flatMap((id) => {
    const pin = savedPins.find((pin) => pin.id === id);
    if (pin) return [pin];
    const record = records.find((record) => record.id === id);
    return record ? [{ id, name: record.project?.name ?? record.location, type: "record" as const, recordId: id }] : [];
  });
  return { snapshot: trackingSchema.parse(snapshot), result: pinsResultSchema.parse({ kind: "pins", action: "pinned", changed, pins, total: pins.length, nextOffset: null }) };
}

export function unpinChatItems(previous: Tracking, records: MapItem[], raw: UnpinItemsInput) {
  const input = unpinItemsSchema.parse(raw);
  const available = chatPins(previous, records);
  if (input.ids.some((id) => !available.some((pin) => pin.id === id) && !previous.following.includes(id))) throw new Error("Pin unavailable. Read list_pins again.");
  const ids = new Set(input.ids);
  const snapshot = trackingSchema.parse({
    ...previous,
    interests: previous.interests.map((pin) => ({
      ...pin,
      archived: interestPath(previous.interests, pin.id).some((parent) => ids.has(parent.id)) ? true : pin.archived,
      issueIds: pin.issueIds.filter((id) => !ids.has(id)),
    })),
    following: previous.following.filter((id) => !ids.has(id)),
  });
  const pins = chatPins(snapshot, records);
  return { snapshot, result: pinsResultSchema.parse({ kind: "pins", action: "unpinned", changed: ids.size, pins: pins.slice(0, 20), total: pins.length, nextOffset: pins.length > 20 ? 20 : null }) };
}
