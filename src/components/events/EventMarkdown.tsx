import MDEditor from "@uiw/react-md-editor";

import { cn } from "@/lib/utils";

import "@uiw/react-markdown-preview/markdown.css";
import "./EventMarkdown.css";

type EventMarkdownProps = {
  value: string | null | undefined;
  className?: string;
  colorMode?: "light" | "dark";
};

export const EventMarkdown = ({ value, className, colorMode = "light" }: EventMarkdownProps) => {
  const source = value?.trim();

  if (!source) {
    return null;
  }

  return (
    <div className={cn("event-markdown-shell", className)} data-color-mode={colorMode}>
      <MDEditor.Markdown source={source} />
    </div>
  );
};