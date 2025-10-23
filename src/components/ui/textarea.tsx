import * as React from "react";
import { cn } from "./cn";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "w-full border rounded-md p-3 min-h-40 focus:outline-none focus:ring-2 focus:ring-blue-500",
          className
        )}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";
