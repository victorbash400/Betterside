import Dialog from "../controls/Dialog";
import { formatDate } from "../../lib/dates";
import type { Contribution } from "../../lib/types";
import styles from "./ContributionDetails.module.css";
export default function ContributionDetails({
  record,
  onClose,
  onProject,
}: {
  record: Contribution;
  onClose: () => void;
  onProject: () => void;
}) {
  return (
    <Dialog title="Contribution" onClose={onClose}>
      <div className={styles.details}>
        <strong>{record.projectName}</strong>
        <dl>
          <dt>Amount</dt>
          <dd>
            {record.currency} {record.amount} · Sandbox
          </dd>
          <dt>Status</dt>
          <dd>{record.status}</dd>
          <dt>Date</dt>
          <dd>{formatDate(record.createdAt)}</dd>
          <dt>Order</dt>
          <dd>{record.id}</dd>
          {record.captureId && (
            <>
              <dt>Capture</dt>
              <dd>{record.captureId}</dd>
            </>
          )}
        </dl>
        <button onClick={onProject}>Open project</button>
      </div>
    </Dialog>
  );
}
