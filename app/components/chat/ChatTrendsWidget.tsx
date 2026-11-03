import type { ChatMessageAction } from "../../lib/chatActions";
import type { ChatTrendsResult } from "../../lib/chatTrends";
import TrendResults from "../trends/TrendResults";
import SettingsInlineButton from "../settings/SettingsInlineButton";
export default function ChatTrendsWidget({ result, onMessage, busy }: {
  result: ChatTrendsResult;
  onMessage: ChatMessageAction;
  busy: boolean;
}) {
  function request(offset: number) {
    onMessage(offset ? "Show more trend series." : "Reload trend history.", { kind: "show-trends", scopes: result.scopes, view: result.view, offset });
  }
  return <section aria-label="Chat trends">
    <TrendResults history={{ result, busy: false, error: "", retry: () => request(0) }} initialView={result.view}/>
    {result.nextOffset !== null && <SettingsInlineButton disabled={busy} onClick={() => request(result.nextOffset!)}>More series</SettingsInlineButton>}
  </section>;
}
