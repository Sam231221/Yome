import React, { useState, useEffect } from "react";
import "./slider.css";

const Slider = ({ min, max, step, value, onChange }) => {
  const handleSliderChange = (e) => {
    const newValue = e.target.value;
    onChange(e, newValue);
  };

  return (
    <>
      <input
        step={step}
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={handleSliderChange}
        className="w-full h-4 rounded-full border bg-black bg-opacity-20 border-gray-300 appearance-none focus:outline-none"
      />
    </>
  );
};

export default Slider;
