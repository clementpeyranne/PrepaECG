"use client";

import { useFormStatus } from "react-dom";

type PendingSubmitButtonProps = {
  label: string;
  pendingLabel: string;
  className?: string;
  disabled?: boolean;
};

export function PendingSubmitButton({
  label,
  pendingLabel,
  className,
  disabled = false
}: PendingSubmitButtonProps) {
  const { pending } = useFormStatus();
  const isDisabled = disabled || pending;

  return (
    <button type="submit" disabled={isDisabled} className={className}>
      {pending ? pendingLabel : label}
    </button>
  );
}
