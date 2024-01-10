import React from "react";

export default function Loader() {
  return (
    <div class="spinner">
      <svg viewBox="25 25 50 50">
        <circle cx="50" cy="50" r="20" fill="none" class="path"></circle>
      </svg>
    </div>
  );
}
