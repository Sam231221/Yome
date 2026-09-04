import React from "react";
import { BsCheck, BsCheckAll } from "react-icons/bs";

function MessageStatus({ messageStatus }: { messageStatus?: string }) {
  return (
    <>
      {messageStatus === "sent" && <BsCheck className="text-sm" />}
      {messageStatus === "delivered" && <BsCheckAll className="text-sm" />}
      {messageStatus === "read" && (
        <BsCheckAll className="text-sm text-green-400" />
      )}
    </>
  );
}

export default MessageStatus;
