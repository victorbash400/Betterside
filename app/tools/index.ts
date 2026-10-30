import "server-only";
import type { WorkspaceToolContext } from "./context.ts";
import { searchRecordsTool } from "./search-records.ts";
import { searchOrganizationsTool } from "./search-organizations.ts";
import { filterMapTool } from "./filter-map.ts";
import { focusOrganizationTool } from "./focus-organization.ts";
import { saveRecordsTool } from "./save-records.ts";
import { calculateTool } from "./calculate.ts";
import { listContributionsTool } from "./list-contributions.ts";
import { preparePaymentTool } from "./prepare-payment.ts";
import { showAnalysisTool } from "./show-analysis.ts";
import { openCheckoutTool } from "./open-checkout.ts";
import { showChartTool } from "./show-chart.ts";
import { showSummaryTool } from "./show-summary.ts";
export function workspaceTools(context: WorkspaceToolContext) {
  return {
    search_records: searchRecordsTool(context),
    search_organizations: searchOrganizationsTool,
    filter_map: filterMapTool,
    focus_organization: focusOrganizationTool,
    save_records: saveRecordsTool,
    calculate: calculateTool,
    list_contributions: listContributionsTool(context),
    show_summary: showSummaryTool(context),
    show_chart: showChartTool(context),
    open_checkout: openCheckoutTool,
    prepare_payment: preparePaymentTool(context),
    show_analysis: showAnalysisTool(context),
  };
}
