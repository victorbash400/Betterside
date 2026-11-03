import type { Contribution } from "../../lib/types";
import SettingsGroup from "../settings/SettingsGroup";
import SettingsRow from "../settings/SettingsRow";
export default function ChatContributionReceipt({ record }: { record: Contribution }) {
  return <SettingsGroup>
    <SettingsRow label="Project"><span>{record.projectName}</span></SettingsRow>
    <SettingsRow label="Order"><span>{record.id}</span></SettingsRow>
    <SettingsRow label="Status"><span>{record.status}</span></SettingsRow>
    <SettingsRow label="Amount"><span>{record.amount} {record.currency}</span></SettingsRow>
    {record.completedAt && <SettingsRow label="Completed"><span>{new Date(record.completedAt).toLocaleString()}</span></SettingsRow>}
    {record.refundedCents !== undefined && <SettingsRow label="Refunded"><span>{(record.refundedCents / 100).toFixed(2)} {record.currency}</span></SettingsRow>}
  </SettingsGroup>;
}
