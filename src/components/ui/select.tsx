import * as React from "react";
import { cn } from "./cn";

type SelectContextType = {
  value: string | undefined;
  setValue: (v: string) => void;
  open: boolean;
  setOpen: (v: boolean) => void;
};
const SelectCtx = React.createContext<SelectContextType | null>(null);

export function Select({ value, onValueChange, children }: { value?: string; onValueChange: (v: string) => void; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  return (
    <SelectCtx.Provider value={{ value, setValue: onValueChange, open, setOpen }}>
      <div className="relative w-full">
        {children}
      </div>
    </SelectCtx.Provider>
  );
}

export function SelectTrigger({ className, children }: React.HTMLAttributes<HTMLButtonElement>) {
  const ctx = React.useContext(SelectCtx);
  return (
    <button
      type="button"
      aria-haspopup="listbox"
      aria-expanded={ctx?.open ?? false}
      onClick={() => ctx?.setOpen(!(ctx?.open ?? false))}
      className={cn("w-full border rounded-md p-2 text-left", className)}
    >
      {children}
    </button>
  );
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  const ctx = React.useContext(SelectCtx);
  return <span>{ctx?.value ?? placeholder ?? ""}</span>;
}

export function SelectContent({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
  const ctx = React.useContext(SelectCtx);
  if (!ctx?.open) return null;
  return (
    <div
      role="listbox"
      className={cn(
        "absolute left-0 right-0 top-full mt-1 z-50 border rounded-md bg-white shadow-sm p-1",
        className
      )}
    >
      {children}
    </div>
  );
}

export function SelectItem({ value, children }: { value: string; children: React.ReactNode }) {
  const ctx = React.useContext(SelectCtx);
  const selected = ctx?.value === value;
  return (
    <div
      role="option"
      aria-selected={selected}
      onClick={() => {
        ctx?.setValue(value);
        ctx?.setOpen(false);
      }}
      className={cn("px-2 py-1 rounded cursor-pointer hover:bg-slate-100", selected && "bg-slate-100")}
    >
      {children}
    </div>
  );
}
