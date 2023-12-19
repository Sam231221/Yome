import React, { useState } from "react";
import { Tab } from "./Tab";

export default function index() {
  const [activeTab, setActiveTab] = useState("1");

  return (
    <>
      <Tab />
    </>
  );
}
