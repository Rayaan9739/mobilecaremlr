import * as React from "react";

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /**
   * a convenience callback similar to Radix's Checkbox component
   * fires with the new checked state.
   */
  onCheckedChange?: (checked: boolean) => void;
}

export const Checkbox = React.forwardRef(
  (
    { className, onCheckedChange, onChange, ...props }: CheckboxProps,
    ref: React.ForwardedRef<HTMLInputElement>,
  ) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onCheckedChange) {
        onCheckedChange(e.target.checked);
      }
      if (onChange) {
        onChange(e);
      }
    };

    return (
      <input
        ref={ref}
        type="checkbox"
        className={className}
        onChange={handleChange}
        {...props}
      />
    );
  },
);
Checkbox.displayName = "Checkbox";
