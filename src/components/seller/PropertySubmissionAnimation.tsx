import React, { useEffect, useState } from 'react';

interface PropertySubmissionAnimationProps {
  stageText?: string;
  hasPhotos?: boolean;
}

export function PropertySubmissionAnimation({
  stageText,
  hasPhotos = true
}: PropertySubmissionAnimationProps) {
  const [currentStage, setCurrentStage] = useState<number>(0);

  // Progressive contextual status without fake percentages
  useEffect(() => {
    const timer1 = setTimeout(() => setCurrentStage(1), 1400);
    const timer2 = setTimeout(() => setCurrentStage(2), 3000);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const stages = [
    {
      title: stageText || 'Submitting your property...',
      detail: hasPhotos
        ? 'Uploading property details and verified photographs'
        : 'Transmitting residential specifications and property details'
    },
    {
      title: 'Securing legal and community records...',
      detail: 'Establishing Bengaluru title registry intake and diligence records'
    },
    {
      title: 'Almost there...',
      detail: 'Finalizing verified listing reference and preparing confirmation'
    }
  ];

  const active = stages[Math.min(currentStage, stages.length - 1)];

  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full max-w-lg mx-auto bg-white border border-slate-200 rounded-2xl p-8 sm:p-10 shadow-xs text-center font-['Poppins']"
    >
      <style>{`
        @keyframes smgDrawStroke {
          0% {
            stroke-dashoffset: 400;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }

        @keyframes smgFillStructure {
          0% {
            fill-opacity: 0;
          }
          100% {
            fill-opacity: 1;
          }
        }

        @keyframes smgFillWindows {
          0% {
            fill-opacity: 0;
            fill: #EBF1FA;
          }
          60% {
            fill: #244B8F;
            fill-opacity: 0.25;
          }
          100% {
            fill: #244B8F;
            fill-opacity: 0.15;
          }
        }

        @keyframes smgFillDoor {
          0% {
            fill-opacity: 0;
          }
          100% {
            fill-opacity: 0.9;
          }
        }

        @keyframes smgSubtlePulse {
          0%, 100% {
            opacity: 0.4;
          }
          50% {
            opacity: 0.9;
          }
        }

        .smg-outline-path {
          stroke-dasharray: 400;
          stroke-dashoffset: 400;
          animation: smgDrawStroke 1.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }

        .smg-building-body {
          animation: smgFillStructure 1.2s ease-out 0.6s forwards;
        }

        .smg-window {
          animation: smgFillWindows 1.4s ease-out 0.9s forwards;
        }

        .smg-door {
          animation: smgFillDoor 1s ease-out 1.1s forwards;
        }

        .smg-pulse-accent {
          animation: smgSubtlePulse 2.2s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .smg-outline-path,
          .smg-building-body,
          .smg-window,
          .smg-door,
          .smg-pulse-accent {
            animation: none !important;
            stroke-dashoffset: 0 !important;
            fill-opacity: 1 !important;
          }
        }
      `}</style>

      {/* Line Art Architectural Animation */}
      <div className="relative w-44 h-44 mx-auto mb-6 flex items-center justify-center">
        <svg
          viewBox="0 0 160 160"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Ground Foundation Line */}
          <line
            x1="18"
            y1="140"
            x2="142"
            y2="140"
            stroke="#172033"
            strokeWidth="3"
            strokeLinecap="round"
            className="smg-outline-path"
          />

          {/* Stepped Rooftop Canopy / Pergola */}
          <path
            d="M54 26 V18 H106 V26"
            stroke="#244B8F"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="smg-outline-path"
          />
          <line
            x1="67"
            y1="18"
            x2="67"
            y2="26"
            stroke="#244B8F"
            strokeWidth="1.5"
            className="smg-outline-path"
          />
          <line
            x1="80"
            y1="18"
            x2="80"
            y2="26"
            stroke="#244B8F"
            strokeWidth="1.5"
            className="smg-outline-path"
          />
          <line
            x1="93"
            y1="18"
            x2="93"
            y2="26"
            stroke="#244B8F"
            strokeWidth="1.5"
            className="smg-outline-path"
          />

          {/* Main Building Body */}
          <path
            d="M32 140 V36 H46 V26 H114 V36 H128 V140 Z"
            fill="#F4F7FC"
            fillOpacity="0"
            stroke="#172033"
            strokeWidth="2.5"
            strokeLinejoin="round"
            className="smg-outline-path smg-building-body"
          />

          {/* Floor Dividers */}
          <line
            x1="32"
            y1="72"
            x2="128"
            y2="72"
            stroke="#244B8F"
            strokeWidth="1.75"
            className="smg-outline-path"
          />
          <line
            x1="32"
            y1="106"
            x2="128"
            y2="106"
            stroke="#244B8F"
            strokeWidth="1.75"
            className="smg-outline-path"
          />

          {/* Floor 3 (Top) Windows */}
          <rect
            x="48"
            y="42"
            width="24"
            height="18"
            rx="1.5"
            stroke="#244B8F"
            strokeWidth="1.75"
            fill="#244B8F"
            fillOpacity="0"
            className="smg-outline-path smg-window"
          />
          <line x1="60" y1="42" x2="60" y2="60" stroke="#244B8F" strokeWidth="1" />
          <line x1="48" y1="51" x2="72" y2="51" stroke="#244B8F" strokeWidth="1" />

          <rect
            x="88"
            y="42"
            width="24"
            height="18"
            rx="1.5"
            stroke="#244B8F"
            strokeWidth="1.75"
            fill="#244B8F"
            fillOpacity="0"
            className="smg-outline-path smg-window"
          />
          <line x1="100" y1="42" x2="100" y2="60" stroke="#244B8F" strokeWidth="1" />
          <line x1="88" y1="51" x2="112" y2="51" stroke="#244B8F" strokeWidth="1" />

          {/* Floor 2 (Middle) Windows & Balcony Line */}
          <rect
            x="48"
            y="78"
            width="24"
            height="18"
            rx="1.5"
            stroke="#244B8F"
            strokeWidth="1.75"
            fill="#244B8F"
            fillOpacity="0"
            className="smg-outline-path smg-window"
          />
          <line x1="60" y1="78" x2="60" y2="96" stroke="#244B8F" strokeWidth="1" />
          <line x1="48" y1="87" x2="72" y2="87" stroke="#244B8F" strokeWidth="1" />

          <rect
            x="88"
            y="78"
            width="24"
            height="18"
            rx="1.5"
            stroke="#244B8F"
            strokeWidth="1.75"
            fill="#244B8F"
            fillOpacity="0"
            className="smg-outline-path smg-window"
          />
          <line x1="100" y1="78" x2="100" y2="96" stroke="#244B8F" strokeWidth="1" />
          <line x1="88" y1="87" x2="112" y2="87" stroke="#244B8F" strokeWidth="1" />

          {/* Ground Floor Entrance Door */}
          <path
            d="M66 140 V114 H94 V140 Z"
            stroke="#172033"
            strokeWidth="2"
            fill="#172033"
            fillOpacity="0"
            className="smg-outline-path smg-door"
          />
          <line x1="80" y1="114" x2="80" y2="140" stroke="#FFFFFF" strokeWidth="1" />
          <circle cx="76" cy="128" r="1" fill="#FFFFFF" />
          <circle cx="84" cy="128" r="1" fill="#FFFFFF" />

          {/* Doorway Canopy */}
          <line
            x1="62"
            y1="114"
            x2="98"
            y2="114"
            stroke="#244B8F"
            strokeWidth="2"
            strokeLinecap="round"
            className="smg-outline-path"
          />

          {/* Subtle Foundation Shimmer Accent */}
          <line
            x1="32"
            y1="138"
            x2="128"
            y2="138"
            stroke="#244B8F"
            strokeWidth="1.5"
            strokeDasharray="6 4"
            className="smg-pulse-accent"
          />
        </svg>
      </div>

      {/* Contextual Status Heading */}
      <h3 className="text-xl sm:text-2xl font-bold text-[#172033] font-['Montserrat'] tracking-tight mb-2 transition-all duration-300">
        {active.title}
      </h3>

      {/* Honest Contextual Subtitle */}
      <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto leading-relaxed mb-6 font-['Poppins'] transition-all duration-300">
        {active.detail}
      </p>

      {/* Discrete Liveness Indicator */}
      <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-slate-600 text-[11px] font-medium font-['Montserrat']">
        <span className="w-2 h-2 rounded-full bg-[#244B8F] animate-pulse" />
        <span>SellMyGhar Secure Submission Engine</span>
      </div>
    </div>
  );
}
