import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

export function InfoToolTip({ text, icon }) {
    const [isVisible, setIsVisible] = useState(false);
    const [coords, setCoords] = useState({ left: 0, top: 0, arrowLeft: '50%' });
    const iconRef = useRef(null);

    const formattedText = text ? text.replace(/\\n/g, '\n') : '';

    const handleMouseEnter = () => {
        if (iconRef.current) {
            const rect = iconRef.current.getBoundingClientRect();
            const tooltipWidth = 224;
            const margin = 12;
            const idealCenter = rect.left + rect.width / 2;
            let finalLeft = idealCenter - (tooltipWidth / 2);
            if (finalLeft < margin) {
                finalLeft = margin;
            } else if (finalLeft + tooltipWidth > window.innerWidth - margin) {
                finalLeft = window.innerWidth - tooltipWidth - margin;
            }

            const arrowPosition = idealCenter - finalLeft;

            setCoords({
                left: finalLeft,
                top: rect.top - 8,
                arrowLeft: arrowPosition
            });
            setIsVisible(true);
        }
    };

    const handleMouseLeave = () => {
        setIsVisible(false);
    };

    useEffect(() => {
        const handleScroll = () => setIsVisible(false);
        if (isVisible) {
            window.addEventListener('scroll', handleScroll, true);
        }
        return () => window.removeEventListener('scroll', handleScroll, true);
    }, [isVisible]);

    return (
        <>
            <div
                ref={iconRef}
                className=""
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onClick={() => setIsVisible(!isVisible)}
            >
                { icon ||
                    <div className="relative ml-1.5 flex items-center">
                        <svg
                            className="w-3.5 h-3.5 text-gray-500 cursor-help hover:text-gray-300 transition-colors"
                            fill="none" viewBox="0 0 24 24" stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                }
            </div>
            {isVisible && createPortal(
                <div className="
            fixed -translate-y-full w-56 p-2.5
            bg-tactical-bg border border-gray-700 shadow-2xl rounded-sm
            text-gray-200 text-xs font-normal leading-relaxed normal-case tracking-normal
            whitespace-pre-line z-[99999] pointer-events-none animate-in fade-in duration-100
          "
                    style={{ left: coords.left, top: coords.top }}
                >
                    {formattedText}
                    <div
                        className="absolute top-full -translate-x-1/2 border-[5px] border-transparent border-t-gray-700"
                        style={{ left: coords.arrowLeft }}
                    ></div>
                    <div
                        className="absolute top-[100%] -translate-x-1/2 border-[4px] border-transparent border-t-tactical-bg -mt-[1px]"
                        style={{ left: coords.arrowLeft }}
                    ></div>
                </div>,
                document.body
            )}
        </>
    );
}