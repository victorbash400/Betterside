import { themeQuartz } from "ag-grid-community";

export const gridTheme = themeQuartz.withParams({
  fontFamily: "var(--ui-font)",
  fontSize: 12,
  backgroundColor: "var(--surface)",
  foregroundColor: "var(--ink)",
  accentColor: "var(--accent)",
  borderColor: "var(--border)",
  headerBackgroundColor: "var(--hover)",
  headerTextColor: "var(--ink)",
  headerFontSize: 11,
  headerFontWeight: 600,
  headerHeight: 36,
  rowHeight: 48,
  cellHorizontalPadding: 14,
  rowBorder: true,
  columnBorder: true,
  headerRowBorder: true,
  headerColumnBorder: true,
  headerColumnBorderHeight: "100%",
  wrapperBorder: false,
  wrapperBorderRadius: 0,
  rowHoverColor: "var(--hover)",
  selectedRowBackgroundColor: "var(--selection)",
  rangeSelectionBorderColor: "var(--accent)",
  oddRowBackgroundColor: "var(--surface)",
  spacing: 5,
});

export const compactGridTheme = gridTheme.withParams({ autoHeightMinBodyHeight: 0 });
