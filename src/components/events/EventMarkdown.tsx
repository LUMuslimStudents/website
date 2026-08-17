import MDEditor from "@uiw/react-md-editor";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";

import "@uiw/react-markdown-preview/markdown.css";
import "./EventMarkdown.css";

type EventMarkdownProps = {
  value: string | null | undefined;
  className?: string;
  colorMode?: "light" | "dark";
};

export const EventMarkdown = ({ value, className, colorMode }: EventMarkdownProps) => {
  const { resolvedTheme } = useTheme();
  // Follow the active theme unless the caller passes an explicit mode,
  // so the library's dark styles (tables, code, etc.) apply correctly.
  const mode = colorMode ?? (resolvedTheme === "dark" ? "dark" : "light");
  const source = value?.trim();

  if (!source) {
    return null;
  }

  return (
    <div className={cn("event-markdown-shell", className)} data-color-mode={mode}>
      <MDEditor.Markdown source={source} />
    </div>
  );
};