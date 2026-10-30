import { memo } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ChatTable from "./ChatTable";
import styles from "./MessageText.module.css";
function MessageText({ text }: { text: string }) {
  return (
    <div className={styles.text}>
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          table: ({ children }) => (
            <ChatTable className={styles.table}>{children}</ChatTable>
          ),
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {text}
      </Markdown>
    </div>
  );
}
export default memo(MessageText);
