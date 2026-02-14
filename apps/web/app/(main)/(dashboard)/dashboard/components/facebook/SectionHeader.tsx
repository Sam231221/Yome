import React from "react";

export default function SectionHeader({
  title,
  actionLabel,
}: {
  title: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-semibold text-[var(--fb-text)]">{title}</h3>
      {actionLabel ? (
        <button className="text-xs font-medium text-[var(--fb-blue)] hover:underline">
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
