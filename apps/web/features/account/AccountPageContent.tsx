"use client";

import {
  ArrowRight,
  Check,
  Flag,
  ImagePlus,
  Lock,
  MessageCircle,
  Monitor,
  Palette,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Badge, Avatar } from "@/components/ui";
import { SETTINGS_TABS } from "./accountSettings";
import {
  noop,
  SettingRow,
  SettingSelect,
  SettingsFooter,
  SettingsGroup,
  SettingsSection,
  Toggle,
} from "./settingsPrimitives";
import { useAccountSettingsController } from "./useAccountSettingsController";

export default function AccountPageContent() {
  const {
    activeTab,
    avatarInitials,
    avatarInputRef,
    avatarPreview,
    darkPreview,
    displayName,
    handleAccountCancel,
    handleAccountInputChange,
    handleAccountUpdate,
    handleAvatarChange,
    handleNavTab,
    handlePasswordUpdate,
    handleRemoveAvatar,
    handleSecurityCancel,
    handleSignOut,
    isSavingAccount,
    isSavingPassword,
    isSecurityFocused,
    isSecurityFormValid,
    prefs,
    saved,
    securitySectionRef,
    setDarkPreview,
    syncSavedState,
    updatePrefs,
    updatedDetails,
    values,
  } = useAccountSettingsController();

  return (
    <main className="settings-page">
      <header className="settings-heading">
        <div>
          <p className="eyebrow">Your Yome</p>
          <h1>Settings</h1>
          <span>
            Control your account, privacy, communication, and learning
            experience.
          </span>
        </div>
        {saved ? (
          <div className="settings-saved">
            <Check size={15} />
            Changes saved
          </div>
        ) : null}
      </header>

      <div className="settings-layout">
        <aside className="settings-nav yome-card rounded-yome border border-yome-border bg-yome-surface shadow-yome">
          {SETTINGS_TABS.map((tab) => (
            <button
              key={tab.key}
              className={activeTab === tab.key ? "active" : ""}
              onClick={() => handleNavTab(tab.key)}
              type="button"
            >
              {tab.icon}
              <span>{tab.label}</span>
              <ArrowRight size={13} />
            </button>
          ))}
          <div />
          <button
            type="button"
            className="signout-setting"
            onClick={handleSignOut}
          >
            Sign out
          </button>
        </aside>

        <section className="settings-content">
          {activeTab === "account" ? (
            <div className="settings-stack">
              <SettingsSection
                title="Profile & account"
                description="Manage the academic identity people see across Yome."
              >
                <div className="account-profile-row">
                  <Avatar
                    initials={avatarInitials}
                    tone="violet"
                    size="lg"
                    image={avatarPreview}
                  />
                  <div className="account-avatar-shell">
                    <strong>Profile image</strong>
                    <p>JPG or PNG, up to 5 MB.</p>
                    <span className="settings-note">
                      Display name: {displayName}
                    </span>
                    <div className="account-actions">
                      <input
                        ref={avatarInputRef}
                        className="settings-hidden-input"
                        accept="image/*"
                        type="file"
                        name="avatar"
                        onChange={handleAvatarChange}
                      />
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                      >
                        <ImagePlus size={14} />
                        Change image
                      </button>
                      <button type="button" onClick={handleRemoveAvatar}>
                        Remove
                      </button>
                    </div>
                  </div>
                </div>

                <div className="settings-form">
                  <label>
                    <span>Email</span>
                    <input
                      name="email"
                      type="email"
                      value={values.email}
                      onChange={handleAccountInputChange}
                      autoComplete="email"
                      placeholder="Email address"
                      required
                    />
                  </label>
                  <label>
                    <span>Username</span>
                    <div className="prefix-field">
                      <b>@</b>
                      <input
                        name="username"
                        type="text"
                        value={values.username}
                        onChange={handleAccountInputChange}
                        autoComplete="username"
                        placeholder="Username"
                        required
                        minLength={3}
                        maxLength={24}
                      />
                    </div>
                  </label>
                  <label className="wide">
                    <span>Biography</span>
                    <textarea
                      name="bio"
                      value={values.bio}
                      onChange={handleAccountInputChange}
                      placeholder="Short bio"
                      maxLength={160}
                    />
                  </label>
                  <label>
                    <span>First name</span>
                    <input
                      name="firstname"
                      type="text"
                      value={values.firstname}
                      onChange={handleAccountInputChange}
                      autoComplete="given-name"
                      placeholder="First name"
                      required
                    />
                  </label>
                  <label>
                    <span>Last name</span>
                    <input
                      name="lastname"
                      type="text"
                      value={values.lastname}
                      onChange={handleAccountInputChange}
                      autoComplete="family-name"
                      placeholder="Last name"
                      required
                    />
                  </label>
                  <label className="wide">
                    <span>Address</span>
                    <input
                      name="address"
                      type="text"
                      value={values.address}
                      onChange={handleAccountInputChange}
                      autoComplete="street-address"
                      placeholder="Address"
                      maxLength={255}
                    />
                  </label>
                </div>

                <SettingsFooter
                  onCancel={handleAccountCancel}
                  onSave={handleAccountUpdate}
                  saveDisabled={!updatedDetails}
                  saveBusy={isSavingAccount}
                  busyLabel="Saving..."
                />
              </SettingsSection>

              <section ref={securitySectionRef}>
                <SettingsSection
                  title="Password & security"
                  description="Protect your Yome account with a strong password."
                  highlighted={isSecurityFocused}
                >
                  <form onSubmit={handlePasswordUpdate}>
                    <div className="settings-form">
                      <label>
                        <span>Current password</span>
                        <input
                          name="currentPassword"
                          type="password"
                          value={values.currentPassword}
                          onChange={handleAccountInputChange}
                          autoComplete="current-password"
                          placeholder="Current password"
                          required
                        />
                      </label>
                      <label>
                        <span>New password</span>
                        <input
                          name="newPassword"
                          type="password"
                          value={values.newPassword}
                          onChange={handleAccountInputChange}
                          autoComplete="new-password"
                          placeholder="New password"
                          required
                          minLength={8}
                          maxLength={64}
                        />
                      </label>
                      <label className="wide">
                        <span>Confirm password</span>
                        <input
                          name="confirmPassword"
                          type="password"
                          value={values.confirmPassword}
                          onChange={handleAccountInputChange}
                          autoComplete="new-password"
                          placeholder="Confirm password"
                          required
                        />
                      </label>
                    </div>

                    <div className="settings-inline-note">
                      <Lock size={16} />
                      <p>
                        Passwords must be at least 8 characters and include an
                        uppercase letter, lowercase letter, number, and symbol.
                      </p>
                    </div>

                    <SettingsFooter
                      onCancel={handleSecurityCancel}
                      saveDisabled={!isSecurityFormValid}
                      saveBusy={isSavingPassword}
                      saveLabel="Update password"
                      busyLabel="Updating password..."
                    />
                  </form>
                </SettingsSection>
              </section>
            </div>
          ) : null}

          {activeTab === "privacy" ? (
            <SettingsSection
              title="Privacy controls"
              description="Choose who can find you, contact you, and see your activity."
            >
              <SettingsGroup title="Profile visibility">
                <SettingSelect
                  title="Who can see your profile?"
                  description="Academic interests, bio, skills, and public contributions."
                  options={[
                    "Everyone on Yome",
                    "Connections only",
                    "Only me",
                  ]}
                />
                <SettingRow
                  title="Show profile in recommendations"
                  description="Let Yome suggest your profile to learners with shared interests."
                >
                  <Toggle
                    checked={prefs.discoverable}
                    onChange={(next) => updatePrefs("discoverable", next)}
                    label="Profile recommendations"
                  />
                </SettingRow>
                <SettingRow
                  title="Show recent learning activity"
                  description="Display public groups, events, and projects on your profile."
                >
                  <Toggle
                    checked={prefs.profileActivity}
                    onChange={(next) => updatePrefs("profileActivity", next)}
                    label="Recent activity"
                  />
                </SettingRow>
              </SettingsGroup>
              <SettingsGroup title="Communication">
                <SettingSelect
                  title="Who can send connection requests?"
                  description="Control who can request to connect with you."
                  options={[
                    "People with shared interests",
                    "Everyone on Yome",
                    "Nobody",
                  ]}
                />
                <SettingSelect
                  title="Who can message you?"
                  description="Other messages will arrive as requests."
                  options={[
                    "Connections and group members",
                    "Connections only",
                    "Nobody",
                  ]}
                />
                <SettingRow
                  title="Allow audio and video calls"
                  description="Only accepted conversations can start calls."
                >
                  <Toggle
                    checked={prefs.calls}
                    onChange={(next) => updatePrefs("calls", next)}
                    label="Allow calls"
                  />
                </SettingRow>
                <SettingRow
                  title="Allow group invitations"
                  description="People in shared communities can invite you."
                >
                  <Toggle
                    checked={prefs.groupInvites}
                    onChange={(next) => updatePrefs("groupInvites", next)}
                    label="Group invitations"
                  />
                </SettingRow>
              </SettingsGroup>
              <SettingsFooter
                onCancel={noop}
                onSave={syncSavedState}
              />
            </SettingsSection>
          ) : null}

          {activeTab === "notifications" ? (
            <SettingsSection
              title="Notification preferences"
              description="Choose which updates deserve your attention."
            >
              <SettingsGroup title="Delivery">
                <SettingRow
                  title="Push notifications"
                  description="Receive time-sensitive updates on this device."
                >
                  <Toggle
                    checked={prefs.push}
                    onChange={(next) => updatePrefs("push", next)}
                    label="Push notifications"
                  />
                </SettingRow>
                <SettingRow
                  title="Email summaries"
                  description="Get a concise weekly learning summary."
                >
                  <Toggle
                    checked={prefs.email}
                    onChange={(next) => updatePrefs("email", next)}
                    label="Email summaries"
                  />
                </SettingRow>
                <SettingRow
                  title="Quiet hours"
                  description="Pause non-urgent notifications from 10:00 PM to 7:00 AM."
                >
                  <Toggle
                    checked={prefs.quietHours}
                    onChange={(next) => updatePrefs("quietHours", next)}
                    label="Quiet hours"
                  />
                </SettingRow>
              </SettingsGroup>
              <SettingsGroup title="Activity">
                <SettingRow
                  title="Event reminders"
                  description="Study sessions and events you joined."
                >
                  <Toggle
                    checked={prefs.eventReminders}
                    onChange={(next) => updatePrefs("eventReminders", next)}
                    label="Event reminders"
                  />
                </SettingRow>
                <SettingRow
                  title="Group announcements"
                  description="Important updates from your communities."
                >
                  <Toggle
                    checked={prefs.groupAnnouncements}
                    onChange={(next) =>
                      updatePrefs("groupAnnouncements", next)
                    }
                    label="Group announcements"
                  />
                </SettingRow>
                <SettingRow
                  title="Reactions and saves"
                  description="When someone finds your contribution helpful."
                >
                  <Toggle
                    checked={prefs.reactions}
                    onChange={(next) => updatePrefs("reactions", next)}
                    label="Reactions"
                  />
                </SettingRow>
              </SettingsGroup>
              <SettingsFooter
                onCancel={noop}
                onSave={syncSavedState}
              />
            </SettingsSection>
          ) : null}

          {activeTab === "safety" ? (
            <SettingsSection
              title="Safety & wellbeing"
              description="Tools for controlling interactions and reporting problems."
            >
              <div className="safety-checkup">
                <div className="safety-mark state-icon">
                  <Check size={22} />
                </div>
                <div>
                  <strong>Your safety checkup is complete</strong>
                  <p>
                    Message requests are filtered and calls from unknown
                    accounts are blocked.
                  </p>
                </div>
                <Badge tone="teal">Protected</Badge>
              </div>
              <SettingsGroup title="Interaction safety">
                <SettingRow
                  title="Filter suspicious message requests"
                  description="Automatically separate likely spam or unsafe requests."
                >
                  <Toggle
                    checked={prefs.filterRequests}
                    onChange={(next) => updatePrefs("filterRequests", next)}
                    label="Filter message requests"
                  />
                </SettingRow>
                <SettingRow
                  title="Hide potentially sensitive media"
                  description="Require a tap before displaying media flagged by safety systems."
                >
                  <Toggle
                    checked={prefs.blurMedia}
                    onChange={(next) => updatePrefs("blurMedia", next)}
                    label="Hide sensitive media"
                  />
                </SettingRow>
              </SettingsGroup>
              <div className="safety-actions-grid">
                <button type="button">
                  <span className="safety-action-icon report">
                    <Flag size={20} />
                  </span>
                  <div>
                    <strong>Report a concern</strong>
                    <p>Report a profile, post, group, or message.</p>
                  </div>
                  <ArrowRight size={16} />
                </button>
                <button type="button">
                  <span className="safety-action-icon block">
                    <Users size={20} />
                  </span>
                  <div>
                    <strong>Blocked accounts</strong>
                    <p>Review 2 blocked accounts.</p>
                  </div>
                  <ArrowRight size={16} />
                </button>
                <button type="button">
                  <span className="safety-action-icon requests">
                    <MessageCircle size={20} />
                  </span>
                  <div>
                    <strong>Message requests</strong>
                    <p>Review filtered requests.</p>
                  </div>
                  <ArrowRight size={16} />
                </button>
                <button type="button">
                  <span className="safety-action-icon support">
                    <ShieldCheck size={20} />
                  </span>
                  <div>
                    <strong>Safety guidance</strong>
                    <p>Learn how Yome protects communities.</p>
                  </div>
                  <ArrowRight size={16} />
                </button>
              </div>
            </SettingsSection>
          ) : null}

          {activeTab === "appearance" ? (
            <SettingsSection
              title="Appearance"
              description="Choose a comfortable visual experience for learning."
            >
              <SettingsGroup title="Theme">
                <div className="theme-picker">
                  <button
                    type="button"
                    className={!darkPreview ? "active" : ""}
                    onClick={() => setDarkPreview(false)}
                  >
                    <span className="theme-preview light">
                      <i />
                      <i />
                      <i />
                    </span>
                    <strong>Light</strong>
                    <small>Bright, neutral surfaces</small>
                  </button>
                  <button
                    type="button"
                    className={darkPreview ? "active" : ""}
                    onClick={() => setDarkPreview(true)}
                  >
                    <span className="theme-preview dark-preview">
                      <i />
                      <i />
                      <i />
                    </span>
                    <strong>Dark</strong>
                    <small>Reduced brightness</small>
                  </button>
                  <button type="button">
                    <span className="theme-preview system">
                      <i />
                      <i />
                      <i />
                    </span>
                    <strong>System</strong>
                    <small>Match your device</small>
                  </button>
                </div>
              </SettingsGroup>
              <SettingsGroup title="Reading">
                <SettingSelect
                  title="Interface density"
                  description="Adjust spacing in feeds, messages, and resource lists."
                  options={["Comfortable", "Compact", "Spacious"]}
                />
                <SettingSelect
                  title="Text size"
                  description="Change interface text without affecting browser zoom."
                  options={["Default", "Larger", "Largest"]}
                />
                <SettingRow
                  title="Reduce motion"
                  description="Limit decorative transitions and movement."
                >
                  <Toggle
                    checked={false}
                    onChange={noop}
                    label="Reduce motion"
                  />
                </SettingRow>
              </SettingsGroup>
            </SettingsSection>
          ) : null}

          {activeTab === "moderation" ? (
            <SettingsSection
              title="Community moderation"
              description="Monitor moderation activity and review action queues."
            >
              <div className="moderation-summary">
                <div>
                  <strong>18</strong>
                  <span>Open reports</span>
                </div>
                <div>
                  <strong>6</strong>
                  <span>Escalated today</span>
                </div>
                <div>
                  <strong>42m</strong>
                  <span>Median response</span>
                </div>
                <div>
                  <strong>97%</strong>
                  <span>SLA met this week</span>
                </div>
              </div>
              <div className="moderation-table">
                <header>
                  <span>Case</span>
                  <span>Summary</span>
                  <span>Queue</span>
                  <span>Status</span>
                  <span>View</span>
                </header>
                {[
                  ["YM-0842", "Harassment in a robotics group thread", "Safety", "Open"],
                  ["YM-0838", "Spam connection requests from a new profile", "Identity", "Review"],
                  ["YM-0834", "Repeated off-topic event promotion", "Groups", "Resolved"],
                ].map(([caseId, summary, queue, status]) => (
                  <div key={caseId}>
                    <span>{caseId}</span>
                    <span>{summary}</span>
                    <span>{queue}</span>
                    <span>{status}</span>
                    <button type="button">Open</button>
                  </div>
                ))}
              </div>
              <div className="moderation-actions">
                <button type="button" className="secondary-button inline-flex items-center justify-center gap-2 rounded-yome border border-yome-border bg-yome-surface font-bold text-yome-blue">
                  Export queue
                </button>
                <button type="button" className="primary-button inline-flex items-center justify-center gap-2 rounded-yome bg-yome-blue font-bold text-white">
                  Open escalation guide
                </button>
              </div>
            </SettingsSection>
          ) : null}

          {activeTab === "system-states" ? (
            <SettingsSection
              title="System states"
              description="Reference loading, empty, success, and inline system feedback."
            >
              <div className="state-tabs">
                <button type="button" className="active">
                  Loading
                </button>
                <button type="button">Empty</button>
                <button type="button">Success</button>
                <button type="button">Error</button>
              </div>
              <div className="states-canvas">
                <div className="skeleton-state">
                  <span className="skeleton-avatar" />
                  <div>
                    <i />
                    <i />
                    <i />
                  </div>
                  <span />
                  <span />
                </div>
              </div>
              <div className="inline-states">
                <div className="inline-banner warning">
                  <span>
                    <Monitor size={14} />
                  </span>
                  <p>
                    <strong>Draft preferences pending</strong> You have unsaved
                    settings changes.
                  </p>
                  <button type="button">Save now</button>
                </div>
                <div className="inline-banner info">
                  <span>
                    <Palette size={14} />
                  </span>
                  <p>
                    <strong>New group tools available</strong> Moderators can
                    now schedule study rooms.
                  </p>
                  <button type="button">Learn more</button>
                </div>
              </div>
            </SettingsSection>
          ) : null}
        </section>
      </div>
    </main>
  );
}
