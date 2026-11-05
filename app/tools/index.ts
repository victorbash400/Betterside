import { getPayPalStatusTool } from "./get-paypal-status.ts";
import { showContributionChartTool } from "./show-contribution-chart.ts";
import { showContributionReportTool } from "./show-contribution-report.ts";
import { manageGoalTool } from "./manage-goal.ts";
import { getContributionTool } from "./get-contribution.ts";
import { showTrendsTool } from "./show-trends.ts";
import { listPinsTool } from "./list-pins.ts";
import { pinItemsTool, unpinItemsTool } from "./pin-items.ts";
import { listGoalsTool } from "./list-goals.ts";
import { createGoalTool } from "./create-goal.ts";
import { updateGoalTool } from "./update-goal.ts";
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
    get_paypal_status: getPayPalStatusTool(context),
    list_pins: listPinsTool(context),
    pin_items: pinItemsTool,
    unpin_items: unpinItemsTool,
    manage_goal: manageGoalTool(context),
    get_contribution: getContributionTool(context),
    list_goals: listGoalsTool(context),
    create_goal: createGoalTool(context),
    update_goal: updateGoalTool(context),
    search_records: searchRecordsTool(context),
    search_organizations: searchOrganizationsTool,
    filter_map: filterMapTool,
    focus_organization: focusOrganizationTool,
    save_records: saveRecordsTool,
    calculate: calculateTool,
    list_contributions: listContributionsTool(context),
    show_trends: showTrendsTool(context),
    show_summary: showSummaryTool(context),
    show_contribution_chart: showContributionChartTool(context),
    show_contribution_report: showContributionReportTool(context),
    show_chart: showChartTool(context),
    open_checkout: openCheckoutTool,
    prepare_payment: preparePaymentTool(context),
    show_analysis: showAnalysisTool(context),
  };
}
