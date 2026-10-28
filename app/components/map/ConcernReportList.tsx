import { useState } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import IconButton from "../controls/IconButton";
import type { MapItem } from "../../lib/types";
import styles from "./ConcernReportList.module.css";
export default function ConcernReportList({
  records,
  onSelect,
}: {
  records: MapItem[];
  onSelect: (item: MapItem) => void;
}) {
  const [page, setPage] = useState(0);
  return (
    <>
      <div className={styles.list}>
        {records.slice(page * 8, (page + 1) * 8).map((item) => (
          <button key={item.id} onClick={() => onSelect(item)}>
            <span>
              {item.location}
              <small>{item.recordType}</small>
            </span>
            <ArrowUpRight size={14} />
          </button>
        ))}
      </div>
      {records.length > 8 && (
        <div className={styles.pages}>
          <IconButton
            label="Previous reports"
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
          >
            <ChevronLeft />
          </IconButton>
          <span>
            {page + 1} / {Math.ceil(records.length / 8)}
          </span>
          <IconButton
            label="Next reports"
            disabled={(page + 1) * 8 >= records.length}
            onClick={() => setPage(page + 1)}
          >
            <ChevronRight />
          </IconButton>
        </div>
      )}
    </>
  );
}
