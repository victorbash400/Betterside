import { useRef } from "react";
import { MoveDownRight } from "lucide-react";
import styles from "./WindowResizeHandle.module.css";
export default function WindowResizeHandle({
  title,
  onResize,
}: {
  title: string;
  onResize: (width: number, height: number) => void;
}) {
  const origin = useRef<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  return (
    <button
      className={styles.handle}
      aria-label={`Resize ${title} window`}
      onPointerDown={(event) => {
        const window = event.currentTarget.parentElement;
        if (!window) return;
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.setPointerCapture(event.pointerId);
        origin.current = {
          x: event.clientX,
          y: event.clientY,
          width: window.clientWidth,
          height: window.clientHeight,
        };
      }}
      onPointerMove={(event) => {
        const start = origin.current;
        if (start)
          onResize(
            start.width + event.clientX - start.x,
            start.height + event.clientY - start.y,
          );
      }}
      onPointerUp={() => {
        origin.current = null;
      }}
      onPointerCancel={() => {
        origin.current = null;
      }}
      onKeyDown={(event) => {
        const window = event.currentTarget.parentElement;
        if (!window) return;
        const delta = {
          ArrowRight: [12, 0],
          ArrowLeft: [-12, 0],
          ArrowDown: [0, 12],
          ArrowUp: [0, -12],
        }[event.key];
        if (delta) {
          event.preventDefault();
          onResize(
            window.clientWidth + delta[0],
            window.clientHeight + delta[1],
          );
        }
      }}
    >
      <MoveDownRight size={12} />
    </button>
  );
}
