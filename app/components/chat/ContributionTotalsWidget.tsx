import { useEffect, useState } from "react";
import type { AgWidgetData, AgWidgetDataFormat, AgWidgetFieldReference, AgWidgetParams } from "ag-studio";
import styles from "./ContributionTotalsWidget.module.css";

export interface ContributionTotalsConfig extends AgWidgetData<
  { net: AgWidgetFieldReference[]; refunds: AgWidgetFieldReference[] },
  AgWidgetDataFormat<unknown>
> {
  type: "contribution-totals";
}

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export default function ContributionTotalsWidget(props: AgWidgetParams<ContributionTotalsConfig>) {
  const [values, setValues] = useState<{ net: number; refunds: number }>();
  const [error, setError] = useState(false);
  useEffect(() => {
    const { dataMapping, widgetApi } = props;
    const net = dataMapping.net?.[0];
    const refunds = dataMapping.refunds?.[0];
    if (!net || !refunds) return;
    const request = new AbortController();
    void widgetApi.getData({ fields: [net, refunds] }, { signal: request.signal })
      .then(({ results }) => {
        if (request.signal.aborted) return;
        const row = results.rows[0];
        setValues({ net: row?.[net.key] ?? 0, refunds: row?.[refunds.key] ?? 0 });
        setError(false);
      })
      .catch(() => {
        if (!request.signal.aborted) setError(true);
      });
    return () => request.abort();
  }, [props]);

  if (error || !props.dataMapping.net?.length || !props.dataMapping.refunds?.length)
    return <span role="alert">Contribution totals unavailable.</span>;
  return (
    <dl className={styles.totals}>
      <div>
        <dt>Net contributed</dt>
        <dd>{values ? currency.format(values.net / 100) : "—"}</dd>
      </div>
      <div>
        <dt>Refunded</dt>
        <dd>{values ? currency.format(values.refunds / 100) : "—"}</dd>
      </div>
    </dl>
  );
}
