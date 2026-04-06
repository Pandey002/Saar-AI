import type { ButtonHTMLAttributes, CSSProperties } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface SparkleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
}

const particles = [
  { x: 18, y: 38, size: 0.22, alpha: 0.9, duration: 10, delay: 0.8 },
  { x: 28, y: 22, size: 0.18, alpha: 0.7, duration: 12, delay: 0.1 },
  { x: 42, y: 16, size: 0.16, alpha: 0.8, duration: 8, delay: 0.5 },
  { x: 58, y: 24, size: 0.24, alpha: 0.95, duration: 9, delay: 0.7 },
  { x: 74, y: 20, size: 0.17, alpha: 0.65, duration: 11, delay: 0.2 },
  { x: 82, y: 40, size: 0.2, alpha: 0.8, duration: 13, delay: 0.9 },
  { x: 30, y: 70, size: 0.2, alpha: 0.75, duration: 10, delay: 0.4 },
  { x: 68, y: 72, size: 0.22, alpha: 0.7, duration: 12, delay: 0.6 },
];

export function SparkleButton({
  label,
  className,
  disabled,
  ...props
}: SparkleButtonProps) {
  return (
    <button
      type="button"
      className={cn("sparkle-button", className)}
      disabled={disabled}
      {...props}
    >
      <span className="spark" aria-hidden="true" />
      <span className="backdrop" aria-hidden="true" />
      <span className="particle-pen" aria-hidden="true">
        {particles.map((particle, index) => (
          <svg
            key={`${particle.x}-${particle.y}-${index}`}
            className="particle"
            viewBox="0 0 24 24"
            style={
              {
                "--x": particle.x,
                "--y": particle.y,
                "--size": particle.size,
                "--alpha": particle.alpha,
                "--duration": particle.duration,
                "--delay": particle.delay,
                "--origin-x": `${particle.x * 10}%`,
                "--origin-y": `${particle.y * 10}%`,
              } as CSSProperties
            }
          >
            <path d="M12 2.5 14.4 9.6 21.5 12l-7.1 2.4L12 21.5l-2.4-7.1L2.5 12l7.1-2.4L12 2.5Z" />
          </svg>
        ))}
      </span>
      <span className="sparkle" aria-hidden="true">
        <Sparkles className="h-[1.05em] w-[1.05em]" />
      </span>
      <span className="text">{label}</span>
    </button>
  );
}
