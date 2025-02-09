import React from "react";
import ReactDOM from "react-dom";

interface PhotoPickerProps {
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function PhotoPicker({ onChange }: PhotoPickerProps) {
  const component = (
    <input type="file" hidden id="photo-picker" onChange={onChange} />
  );
  const photoPickerElement = document.getElementById("photo-picker-element");
  return photoPickerElement
    ? ReactDOM.createPortal(component, photoPickerElement)
    : null;
}
