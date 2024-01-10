"use client";
import React, { useEffect, useRef } from "react";

import { FaAngleLeft, FaAngleRight } from "react-icons/fa"; // Importing specific icons

export default function Carousel({ children }) {
  const carouselRef = useRef(null);
  const leftArrorwBtnRef = useRef(null);
  const rightArrowBtnRef = useRef(null);

  let isDragStart = false,
    isDragging = false,
    prevPageX,
    prevScrollLeft,
    positionDiff;

  const autoSlide = () => {
    // if there is no image left to scroll then return from here
    if (
      carouselRef.current.scrollLeft -
        (carouselRef.current.scrollWidth - carouselRef.current.clientWidth) >
        -1 ||
      carouselRef.current.scrollLeft <= 0
    )
      return;

    positionDiff = Math.abs(positionDiff); // making positionDiff value to positive
    let firstImgWidth = carouselRef.current.firstElementChild.clientWidth + 14;
    // getting difference value that needs to add or reduce from carousel left to take middle img center
    let valDifference = firstImgWidth - positionDiff;

    if (carouselRef.current.scrollLeft > prevScrollLeft) {
      // if user is scrolling to the right
      return (carouselRef.current.scrollLeft +=
        positionDiff > firstImgWidth / 3 ? valDifference : -positionDiff);
    }
    // if user is scrolling to the left
    carouselRef.current.scrollLeft -=
      positionDiff > firstImgWidth / 3 ? valDifference : -positionDiff;
  };

  const dragStart = (e) => {
    // updatating global variables value on mouse down event
    isDragStart = true;
    prevPageX = e.pageX || e.touches[0].pageX;
    prevScrollLeft = carouselRef.current.scrollLeft;
  };

  const dragging = (e) => {
    // scrolling images/carousel to left according to mouse pointer
    if (!isDragStart) return;
    e.preventDefault();
    isDragging = true;
    carouselRef.current.classList.add("dragging");
    positionDiff = (e.pageX || e.touches[0].pageX) - prevPageX;
    carouselRef.current.scrollLeft = prevScrollLeft - positionDiff;
    showHideIcons();
  };

  const dragStop = () => {
    isDragStart = false;
    carouselRef.current.classList.remove("dragging");

    if (!isDragging) return;
    isDragging = false;
    autoSlide();
  };
  const showHideIcons = () => {
    // showing and hiding prev/next icon according to carousel scroll left value
    let scrollWidth =
      carouselRef.current.scrollWidth - carouselRef.current.clientWidth; // getting max scrollable width

    // Handle left arrow visibility
    const leftArrow = document.getElementById("left-arrow");
    if (leftArrow) {
      leftArrow.style.display =
        carouselRef.current.scrollLeft === 0 ? "none" : "block";
    }

    // Handle right arrow visibility
    const rightArrow = document.getElementById("right-arrow");
    if (rightArrow) {
      rightArrow.style.display =
        carouselRef.current.scrollLeft === scrollWidth ? "none" : "block";
    }
  };
  const handleBtnClick = (e) => {
    // getting first img width & adding 14 margin value
    //change this value if u change margin value in css
    let firstImgWidth = carouselRef.current.firstElementChild.clientWidth + 14;
    // if clicked icon is left, reduce width value from the carousel scroll left else add to it
    carouselRef.current.scrollLeft +=
      e.target.id == "left-arrow" ? -firstImgWidth : firstImgWidth;
    // calling showHideIcons after 60ms
    setTimeout(() => showHideIcons(e), 60);
  };
  useEffect(() => {
    document.addEventListener("mousemove", dragging);
    document.addEventListener("mouseup", dragStop);
    return () => {
      document.addEventListener("mousemove", dragging);
      document.addEventListener("mouseup", dragStop);
    };
  });

  return (
    <div className="flex  wrapper max-w-[1200px] relative">
      {/* Left arrow */}
      <FaAngleLeft
        ref={leftArrorwBtnRef}
        id="left-arrow"
        onClick={(e) => handleBtnClick(e)}
        className="absolute top-1/2 h-11 w-11 text-gray-700 cursor-pointer text-lg text-center leading-11 bg-[#F0F2F5] rounded-full transform -translate-y-1/2 transition duration-100 hover:bg-gray-200 active:-translate-y-[50%] active:scale-90 first:left-[-22px] first:hidden last:right-0"
      />

      {/* Carousel */}
      <div
        onMouseDown={(e) => dragStart(e)}
        onTouchStart={(e) => dragStart(e)}
        onTouchMove={(e) => dragging(e)}
        onTouchEnd={(e) => dragStop(e)}
        ref={carouselRef}
        className="gap-3 w-full carousel  overflow-hidden whitespace-nowrap cursor-pointer scroll-smooth"
      >
        {children}
      </div>

      {/* Right arrow */}
      <FaAngleRight
        id="right-arrow"
        ref={rightArrowBtnRef}
        onClick={(e) => handleBtnClick(e)}
        className="absolute top-1/2 h-11 w-11 text-gray-700 cursor-pointer text-lg text-center leading-11 bg-[#F0F2F5] rounded-full transform -translate-y-1/2 transition duration-100 hover:bg-gray-200 active:-translate-y-[50%] active:scale-90 first:left-[-22px] first:hidden last:right-0"
      />
    </div>
  );
}
