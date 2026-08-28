import React from "react";

function Empty() {
  return (
    <div className="chat-empty-state">
      <div className="chat-empty-card">
        <span className="chat-empty-kicker">Yome Messages</span>
        <h1>Select a conversation to start learning together.</h1>
        <p>Your live messages, calls, files, and study chats will appear here.</p>
        <div className="typing-indicator">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}

export default Empty;
