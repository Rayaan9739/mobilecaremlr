import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type SelectContextValue = {
  value?: string;
  onValueChange?: (v: string) => void;
  open: boolean;
  setOpen: (v: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
};

const SelectContext = React.createContext<SelectContextValue | null>(null);

function useSelectContext() {
  const ctx = React.useContext(SelectContext);
  if (!ctx) throw new Error("Select components must be used within <Select />");
  return ctx;
}

export function Select({
  value,
  onValueChange,
  children,
}: {
  value?: string;
  onValueChange?: (v: string) => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);

  return (
    <SelectContext.Provider
      value={{ value, onValueChange, open, setOpen, triggerRef }}
    >
      <div className="relative">{children}</div>
    </SelectContext.Provider>
  );
}

export function SelectTrigger({
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { open, setOpen, triggerRef } = useSelectContext();
  return (
    <button
      ref={triggerRef}
      type="button"
      aria-haspopup="listbox"
      aria-expanded={open}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
        className,
      )}
      onClick={(e) => {
        props.onClick?.(e);
        setOpen(!open);
      }}
      {...props}
    >
      {children}
    </button>
  );
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  const { value } = useSelectContext();
  return <span className="truncate text-left">{value ?? placeholder ?? ""}</span>;
}

export function SelectContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { open, setOpen, triggerRef } = useSelectContext();
  const [mounted, setMounted] = React.useState(false);
  const [pos, setPos] = React.useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  React.useEffect(() => setMounted(true), []);

  const updatePosition = React.useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPos({
      top: rect.bottom + 8,
      left: rect.left,
      width: rect.width,
    });
  }, [triggerRef]);

  React.useEffect(() => {
    if (!open) return;
    updatePosition();

    const onScroll = () => updatePosition();
    const onResize = () => updatePosition();

    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open, updatePosition]);

  if (!open || !mounted || !pos) return null;

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[190]"
        onMouseDown={() => setOpen(false)}
      />
      <div
        role="listbox"
        className={cn(
          "fixed z-[200] max-h-72 overflow-auto rounded-md border border-border bg-card p-1 text-foreground shadow-elevated",
          className,
        )}
        style={{ top: pos.top, left: pos.left, minWidth: pos.width }}
        onMouseDown={(e) => e.stopPropagation()}
        {...props}
      >
        {children}
      </div>
    </>,
    document.body,
  );
}

export function SelectItem({
  value,
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { value: string }) {
  const { onValueChange, setOpen } = useSelectContext();

  return (
    <div
      role="option"
      tabIndex={0}
      className={cn(
        "cursor-pointer select-none rounded-sm px-2 py-2 text-sm outline-none",
        "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
        className,
      )}
      onClick={(e) => {
        props.onClick?.(e);
        onValueChange?.(value);
        setOpen(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onValueChange?.(value);
          setOpen(false);
        }
      }}
      {...props}
    >
      {children}
    </div>
  );
}
