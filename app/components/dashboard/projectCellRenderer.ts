import { createElement } from "react";
import type { ICellRendererParams } from "ag-grid-enterprise";
import type { Issue } from "../../lib/types";
import ProjectCell from "./ProjectCell";
export function projectCellRenderer(
  issues: Issue[],
  onSelect: (issue: Issue) => void,
) {
  return (params: ICellRendererParams) =>
    createElement(ProjectCell, { value: params.value, issues, onSelect });
}
