import React, { useRef, useEffect } from "react";
import { Bold, Italic, Underline, List, ListOrdered, Type } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ value, onChange, placeholder = "Enter description..." }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const executeCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      document.execCommand("insertHTML", false, "&nbsp;&nbsp;&nbsp;&nbsp;");
    }
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="bg-secondary border-b border-border p-2 flex gap-1 flex-wrap">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => executeCommand("bold")}
          title="Bold (Ctrl+B)"
          className="w-8 h-8 p-0"
        >
          <Bold className="w-4 h-4" />
        </Button>
        
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => executeCommand("italic")}
          title="Italic (Ctrl+I)"
          className="w-8 h-8 p-0"
        >
          <Italic className="w-4 h-4" />
        </Button>
        
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => executeCommand("underline")}
          title="Underline (Ctrl+U)"
          className="w-8 h-8 p-0"
        >
          <Underline className="w-4 h-4" />
        </Button>

        <div className="border-r border-border mx-1" />

        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => executeCommand("insertUnorderedList")}
          title="Bullet List"
          className="w-8 h-8 p-0"
        >
          <List className="w-4 h-4" />
        </Button>

        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => executeCommand("insertOrderedList")}
          title="Numbered List"
          className="w-8 h-8 p-0"
        >
          <ListOrdered className="w-4 h-4" />
        </Button>

        <div className="border-r border-border mx-1" />

        <select
          onChange={(e) => {
            if (e.target.value) {
              executeCommand("formatBlock", `<${e.target.value}>`);
              e.target.value = "";
            }
          }}
          defaultValue=""
          className="px-2 py-1 text-sm border border-border rounded bg-background text-foreground"
        >
          <option value="">Heading</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="p">Paragraph</option>
        </select>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        className="p-4 min-h-[200px] bg-background text-foreground outline-none focus:outline-none prose prose-sm prose-invert max-w-none"
        contentEditable
        suppressContentEditableWarning
        style={{
          wordBreak: "break-word",
          overflowWrap: "break-word",
        }}
      >
        {!value && <span className="text-muted-foreground">{placeholder}</span>}
      </div>

      {/* HTML Preview (optional, for debugging) */}
      <details className="text-xs">
        <summary className="p-2 bg-secondary border-t border-border cursor-pointer hover:bg-secondary/80">
          HTML Source
        </summary>
        <pre className="p-2 bg-black/20 text-white overflow-auto text-[10px] max-h-24">
          {value}
        </pre>
      </details>
    </div>
  );
}
