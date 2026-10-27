import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type PointerEvent,
} from "react";
import { Maximize2, Minimize2, X } from "lucide-react";
import IconButton from "../controls/IconButton";
import WindowResizeHandle from "./WindowResizeHandle";
import styles from "./MapWindow.module.css";
export default function MapWindow({
  title,
  hidden,
  offset = 0,
  children,
  onClose,
}: {
  title: string;
  hidden?: boolean;
  offset?: number;
  children: ReactNode;
  onClose: () => void;
}) {
  const surface = useRef<HTMLElement>(null);
  const [position, setPosition] = useState({ x: 14 + offset, y: 14 + offset });
  const [size, setSize] = useState<{ width: number; height: number }>();
  const [focused, setFocused] = useState(false);
  const drag = useRef<{
    x: number;
    y: number;
    left: number;
    top: number;
  } | null>(null);
  useEffect(() => {
    const parent = surface.current?.parentElement;
    if (!parent) return;
    const observer = new ResizeObserver(() => {
      const node = surface.current;
      if (!node) return;
      setPosition((value) => ({
        x: Math.max(
          0,
          Math.min(value.x, parent.clientWidth - node.clientWidth - 60),
        ),
        y: Math.max(0, Math.min(value.y, parent.clientHeight - 48)),
      }));
    });
    observer.observe(parent);
    return () => observer.disconnect();
  }, []);
  function start(event: PointerEvent<HTMLButtonElement>) {
    if (focused || event.pointerType === "touch") return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      x: event.clientX,
      y: event.clientY,
      left: position.x,
      top: position.y,
    };
  }
  return (
    <section
      hidden={hidden}
      ref={surface}
      className={`${styles.window} ${focused ? styles.focused : ""}`}
      style={
        focused ? undefined : { left: position.x, top: position.y, ...size }
      }
      aria-label={`${title} window`}
      onPointerDown={() => surface.current?.focus()}
      tabIndex={-1}
    >
      <header className={styles.header}>
        <button
          className={styles.handle}
          onPointerDown={start}
          onPointerMove={(event) => {
            const origin = drag.current,
              node = surface.current,
              parent = node?.parentElement;
            if (!origin || !node || !parent) return;
            setPosition({
              x: Math.max(
                0,
                Math.min(
                  parent.clientWidth - node.clientWidth,
                  origin.left + event.clientX - origin.x,
                ),
              ),
              y: Math.max(
                0,
                Math.min(
                  parent.clientHeight - 48,
                  origin.top + event.clientY - origin.y,
                ),
              ),
            });
          }}
          onPointerUp={() => {
            drag.current = null;
          }}
          onPointerCancel={() => {
            drag.current = null;
          }}
          onKeyDown={(event) => {
            const movement = {
              ArrowLeft: [-12, 0],
              ArrowRight: [12, 0],
              ArrowUp: [0, -12],
              ArrowDown: [0, 12],
            }[event.key];
            if (!movement || focused) return;
            event.preventDefault();
            setPosition((value) => ({
              x: Math.max(0, value.x + movement[0]),
              y: Math.max(0, value.y + movement[1]),
            }));
          }}
          aria-label={`Move ${title} window`}
        >
          {title}
        </button>
        <IconButton
          label={focused ? `Restore ${title} window` : `Focus ${title} window`}
          onClick={() => setFocused((value) => !value)}
        >
          {focused ? <Minimize2 /> : <Maximize2 />}
        </IconButton>
        <IconButton label={`Close ${title} window`} onClick={onClose}>
          <X />
        </IconButton>
      </header>
      <div className={styles.content}>{children}</div>
      {!focused && (
        <WindowResizeHandle
          title={title}
          onResize={(width, height) => {
            const parent = surface.current?.parentElement;
            if (!parent) return;
            setSize({
              width: Math.max(
                260,
                Math.min(width, parent.clientWidth - position.x - 60),
              ),
              height: Math.max(
                220,
                Math.min(height, parent.clientHeight - position.y - 12),
              ),
            });
          }}
        />
      )}
    </section>
  );
}
