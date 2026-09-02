"use client";

import type { ReactNode } from "react";

export function noop() {}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      className={checked ? "toggle-switch on" : "toggle-switch"}
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
      aria-label={label}
    >
      <i />
    </button>
  );
}

export function SettingsSection({
  title,
  description,
  children,
  highlighted = false,
}: {
  title: string;
  description: string;
  children: ReactNode;
  highlighted?: boolean;
}) {
  return (
    <article
      className={
        highlighted
          ? "settings-section yome-card settings-section-highlighted"
          : "settings-section yome-card"
      }
    >
      <header>
        <h2>{title}</h2>
        <p>{description}</p>
      </header>
      {children}
    </article>
  );
}

export function SettingsGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="settings-group">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

export function SettingRow({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="setting-row">
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
      {children}
    </div>
  );
}

export function SettingSelect({
  title,
  description,
  options,
}: {
  title: string;
  description: string;
  options: string[];
}) {
  return (
    <SettingRow title={title} description={description}>
      <select defaultValue={options[0]}>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </SettingRow>
  );
}

export function SettingsFooter({
  onCancel,
  onSave,
  saveLabel = "Save changes",
  saveDisabled = false,
  saveBusy = false,
  busyLabel,
}: {
  onCancel: () => void;
  onSave?: () => void;
  saveLabel?: string;
  saveDisabled?: boolean;
  saveBusy?: boolean;
  busyLabel?: string;
}) {
  return (
    <footer className="settings-footer">
      <button
        type="button"
        className="secondary-button inline-flex items-center justify-center gap-2 rounded-yome border border-yome-border bg-yome-surface font-bold text-yome-blue"
        onClick={onCancel}
      >
        Cancel
      </button>
      <button
        type={onSave ? "button" : "submit"}
        className="primary-button inline-flex items-center justify-center gap-2 rounded-yome bg-yome-blue font-bold text-white"
        onClick={onSave}
        disabled={saveDisabled || saveBusy}
      >
        {saveBusy ? busyLabel || saveLabel : saveLabel}
      </button>
    </footer>
  );
}
