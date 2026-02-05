import React, { useRef, useState } from "react";
import TopNav from "./TopNav";
import LeftSidebar from "./LeftSidebar";
import RightSidebar from "./RightSidebar";
import { Contact, UserLite } from "./types";
import NotificationsPanel from "./NotificationsPanel";
import { messagesByContact } from "./data";
import ChatWindow from "./ChatWindow";
import ChatDrawer from "./ChatDrawer";

export default function DashboardShell({
  user,
  children,
}: {
  user: UserLite;
  children: React.ReactNode;
}) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [openChats, setOpenChats] = useState<Contact[]>([]);
  const [activeMobileChat, setActiveMobileChat] = useState<Contact | null>(
    null
  );
  const notificationButtonRef = useRef<HTMLButtonElement>(null);

  const handleToggleNotifications = () => {
    setNotificationsOpen((prev) => !prev);
  };

  const handleCloseNotifications = () => {
    setNotificationsOpen(false);
  };

  const handleOpenChat = (contact: Contact) => {
    setActiveMobileChat(contact);
    setOpenChats((prev) => {
      const existing = prev.find((item) => item.id === contact.id);
      if (existing) {
        const filtered = prev.filter((item) => item.id !== contact.id);
        return [...filtered, contact];
      }
      const next = [...prev, contact];
      return next.length > 3 ? next.slice(next.length - 3) : next;
    });
  };

  const handleCloseChat = (contactId: string) => {
    setOpenChats((prev) => prev.filter((item) => item.id !== contactId));
    setActiveMobileChat((prev) =>
      prev?.id === contactId ? null : prev
    );
  };

  const notificationsPanel = notificationsOpen ? (
    <NotificationsPanel
      onClose={handleCloseNotifications}
      triggerRef={notificationButtonRef}
    />
  ) : null;

  return (
    <div className="min-h-screen bg-[var(--fb-bg)] text-[var(--fb-text)]">
      <TopNav
        user={user}
        onToggleNotifications={handleToggleNotifications}
        notificationsOpen={notificationsOpen}
        notificationButtonRef={notificationButtonRef}
        notificationsPanel={notificationsPanel}
      />
      <div className="mx-auto max-w-[1280px] px-3 sm:px-4 lg:px-6">
        <div className="grid grid-cols-1 gap-6 py-6 lg:grid-cols-[280px_minmax(0,1fr)_280px]">
          <aside className="custom-scrollbar sticky top-[76px] hidden h-[calc(100vh-96px)] overflow-y-auto lg:block">
            <LeftSidebar user={user} />
          </aside>
          <main className="min-w-0">{children}</main>
          <aside className="custom-scrollbar sticky top-[76px] hidden h-[calc(100vh-96px)] overflow-y-auto lg:block">
            <RightSidebar onContactClick={handleOpenChat} />
          </aside>
        </div>
      </div>

      {openChats.map((contact, index) => (
        <ChatWindow
          key={contact.id}
          contact={contact}
          messages={messagesByContact[contact.id] || []}
          onClose={handleCloseChat}
          offsetIndex={index}
        />
      ))}

      {activeMobileChat ? (
        <ChatDrawer
          contact={activeMobileChat}
          messages={messagesByContact[activeMobileChat.id] || []}
          onClose={handleCloseChat}
        />
      ) : null}
    </div>
  );
}
