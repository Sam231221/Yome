import React, { useEffect, useRef, MouseEvent, TouchEvent } from "react";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa";

interface CarouselProps {
  children: React.ReactNode;
}

const FaAngleLeftIcon = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>((props, ref) => (
  <div {...props} ref={ref}>
    <FaAngleLeft />
  </div>
));

const FaAngleRightIcon = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>((props, ref) => (
  <div {...props} ref={ref}>
    <FaAngleRight />
  </div>
));

const Carousel: React.FC<CarouselProps> = ({ children }) => {
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const leftArrowBtnRef = useRef<HTMLDivElement | null>(null);
  const rightArrowBtnRef = useRef<HTMLDivElement | null>(null);

  let isDragStart = false,
    isDragging = false,
    prevPageX = 0,
    prevScrollLeft = 0,
    positionDiff = 0;

  const autoSlide = () => {
    if (carouselRef.current) {
      const scrollWidth =
        carouselRef.current.scrollWidth - carouselRef.current.clientWidth;
      if (
        carouselRef.current.scrollLeft <= 0 ||
        carouselRef.current.scrollLeft - scrollWidth >= 0
      )
        return;

      positionDiff = Math.abs(positionDiff);
      const firstImgWidth =
        (carouselRef.current?.firstElementChild?.clientWidth ?? 0) + 14;
      const valDifference = firstImgWidth - positionDiff;

      carouselRef.current.scrollLeft +=
        positionDiff > firstImgWidth / 3
          ? carouselRef.current.scrollLeft > prevScrollLeft
            ? valDifference
            : -valDifference
          : -positionDiff;
    }
  };

  const dragStart = (e: MouseEvent | TouchEvent) => {
    if (carouselRef.current) {
      isDragStart = true;
      prevPageX =
        (e as TouchEvent).touches?.[0]?.pageX || (e as MouseEvent).pageX;
      prevScrollLeft = carouselRef.current.scrollLeft;
    }
  };

  const dragging = (e: MouseEvent | TouchEvent) => {
    if (!isDragStart || !carouselRef.current) return;
    e.preventDefault();
    isDragging = true;
    carouselRef.current.classList.add("dragging");
    const currentPageX =
      (e as TouchEvent).touches?.[0]?.pageX || (e as MouseEvent).pageX;
    positionDiff = currentPageX - prevPageX;
    carouselRef.current.scrollLeft = prevScrollLeft - positionDiff;
    showHideIcons();
  };

  const dragStop = () => {
    if (!isDragging || !carouselRef.current) return;
    isDragStart = false;
    isDragging = false;
    carouselRef.current.classList.remove("dragging");
    autoSlide();
  };

  const showHideIcons = () => {
    if (!carouselRef.current) return;
    const scrollWidth =
      carouselRef.current.scrollWidth - carouselRef.current.clientWidth;
    leftArrowBtnRef.current!.style.display =
      carouselRef.current.scrollLeft === 0 ? "none" : "flex";
    rightArrowBtnRef.current!.style.display =
      carouselRef.current.scrollLeft >= scrollWidth ? "none" : "flex";
  };

  const handleBtnClick = (e: MouseEvent) => {
    if (!carouselRef.current) return;
    const firstImgWidth =
      (carouselRef.current?.firstElementChild?.clientWidth ?? 0) + 14;

    carouselRef.current.scrollLeft +=
      (e.currentTarget as HTMLElement).id === "left-arrow"
        ? -firstImgWidth
        : firstImgWidth;
    setTimeout(showHideIcons, 60);
  };

  useEffect(() => {
    // Mouse event handler for dragging
    const handleMouseMove = (e: MouseEvent) => dragging(e);
    const handleMouseUp = () => dragStop();

    // Touch event handler for dragging
    const handleTouchMove = (e: TouchEvent) => dragging(e);
    const handleTouchEnd = () => dragStop();

    // Add mouse and touch event listeners
    document.addEventListener(
      "mousemove",
      handleMouseMove as unknown as EventListener
    );
    document.addEventListener(
      "mouseup",
      handleMouseUp as unknown as EventListener
    );
    document.addEventListener(
      "touchmove",
      handleTouchMove as unknown as EventListener
    );
    document.addEventListener(
      "touchend",
      handleTouchEnd as unknown as EventListener
    );

    // Cleanup event listeners on unmount
    return () => {
      document.removeEventListener(
        "mousemove",
        handleMouseMove as unknown as EventListener
      );
      document.removeEventListener(
        "mouseup",
        handleMouseUp as unknown as EventListener
      );
      document.removeEventListener(
        "touchmove",
        handleTouchMove as unknown as EventListener
      );
      document.removeEventListener(
        "touchend",
        handleTouchEnd as unknown as EventListener
      );
    };
  });

  return (
    <div className="flex relative">
      {/* Left arrow */}
      <FaAngleLeftIcon
        ref={leftArrowBtnRef}
        id="left-arrow"
        onClick={handleBtnClick}
        className="absolute z-[2] flex items-center justify-center top-1/2 h-11 w-11 text-gray-700 cursor-pointer text-lg text-center leading-11 bg-[#F0F2F5] rounded-full transform -translate-y-1/2 transition duration-100 hover:bg-gray-200 active:scale-90 first:left-[-22px] first:hidden last:right-0"
      />

      {/* Carousel */}
      <div
        onMouseDown={dragStart}
        onTouchStart={dragStart}
        onTouchMove={dragging}
        onTouchEnd={dragStop}
        ref={carouselRef}
        className="w-full carousel overflow-hidden whitespace-nowrap cursor-pointer scroll-smooth"
      >
        {children}
      </div>

      {/* Right arrow */}
      <FaAngleRightIcon
        ref={rightArrowBtnRef}
        id="right-arrow"
        onClick={handleBtnClick}
        className="absolute z-[2] flex items-center justify-center top-1/2 h-11 w-11 text-gray-700 cursor-pointer text-lg text-center leading-11 bg-[#F0F2F5] rounded-full transform -translate-y-1/2 transition duration-100 hover:bg-gray-200 active:scale-90 first:left-[-22px] first:hidden last:right-0"
      />
    </div>
  );
};

export default Carousel;
