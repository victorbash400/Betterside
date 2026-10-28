import { ChevronLeft, ChevronRight } from "lucide-react";
import IconButton from "../controls/IconButton";
import styles from "./RecordPagination.module.css";
export default function RecordPagination({ page, pages, onPage }: {
  page: number; pages: number; onPage: (page: number) => void;
}) {
  return (
    <nav className={styles.pagination} aria-label="Record pages">
      <IconButton label="Previous page" disabled={page === 0} onClick={() => onPage(page - 1)}><ChevronLeft /></IconButton>
      <span>{page + 1} / {pages}</span>
      <IconButton label="Next page" disabled={page + 1 === pages} onClick={() => onPage(page + 1)}><ChevronRight /></IconButton>
    </nav>
  );
}
