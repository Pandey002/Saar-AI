import React, { useEffect, useRef, useState } from "react";
import { CheckCircle2, X } from "lucide-react";

interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, isVisible, onClose, duration = 4000 }: ToastProps) {
  const [phase, setPhase] = useState<"hidden" | "entering" | "visible" | "exiting">("hidden");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isVisible) {
      // Start entrance
      setPhase("entering");
      // Tiny delay so the browser paints the initial off-screen state first
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setPhase("visible");
        });
      });

      // Auto-dismiss
      timeoutRef.current = setTimeout(() => {
        setPhase("exiting");
        setTimeout(() => {
          onClose();
          setPhase("hidden");
        }, 500); // match exit animation duration
      }, duration);

      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    } else {
      if (phase === "visible" || phase === "entering") {
        setPhase("exiting");
        setTimeout(() => setPhase("hidden"), 500);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, duration]);

  if (phase === "hidden") return null;

  const isShowing = phase === "visible";

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[99999] flex justify-center pointer-events-none"
      style={{ padding: "20px 16px 0" }}
    >
      <div
        style={{
          transform: isShowing ? "translateY(0)" : "translateY(-120%)",
          opacity: isShowing ? 1 : 0,
          transition: "transform 600ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 400ms ease",
          pointerEvents: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "14px 20px 14px 16px",
            borderRadius: "16px",
            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow:
              "0 20px 60px rgba(15, 23, 42, 0.35), 0 8px 24px rgba(15, 23, 42, 0.2), 0 0 0 1px rgba(255,255,255,0.04) inset",
            backdropFilter: "blur(20px)",
            maxWidth: "420px",
            width: "100%",
          }}
        >
          {/* Glow check icon */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "30px",
              height: "30px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, rgba(52, 211, 153, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)",
              boxShadow: "0 0 12px rgba(52, 211, 153, 0.25)",
              flexShrink: 0,
            }}
          >
            <CheckCircle2
              style={{
                width: "17px",
                height: "17px",
                color: "#34d399",
                filter: "drop-shadow(0 0 4px rgba(52, 211, 153, 0.5))",
              }}
            />
          </div>

          {/* Message */}
          <p
            style={{
              margin: 0,
              fontSize: "13.5px",
              fontWeight: 600,
              color: "#f1f5f9",
              letterSpacing: "-0.01em",
              lineHeight: 1.4,
            }}
          >
            {message}
          </p>

          {/* Close button */}
          <button
            onClick={() => {
              if (timeoutRef.current) clearTimeout(timeoutRef.current);
              setPhase("exiting");
              setTimeout(() => {
                onClose();
                setPhase("hidden");
              }, 500);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "24px",
              height: "24px",
              borderRadius: "8px",
              border: "none",
              background: "transparent",
              color: "rgba(148, 163, 184, 0.6)",
              cursor: "pointer",
              marginLeft: "4px",
              flexShrink: 0,
              transition: "background 200ms ease, color 200ms ease, transform 200ms ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.08)";
              e.currentTarget.style.color = "#e2e8f0";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "rgba(148, 163, 184, 0.6)";
            }}
          >
            <X style={{ width: "13px", height: "13px" }} />
          </button>
        </div>
      </div>
    </div>
  );
}
