import { useTrends } from "../../state/useTrends";
import type { TrendScope } from "../../lib/trends";
import TrendResults from "./TrendResults";
export default function TrendPanel({ scopes, recordId }: { scopes: TrendScope[]; recordId?: string }) {
  return <TrendResults history={useTrends(scopes)} recordId={recordId}/>;
}
