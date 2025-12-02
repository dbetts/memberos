import { ReactNode, useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

type TooltipProps = {
  content?: ReactNode;
  children: ReactNode;
};

export default function Tooltip({ content, children }: TooltipProps) {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    function handleReposition() {
      if (!visible || !triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.top + window.scrollY - 8,
        left: rect.left + rect.width / 2 + window.scrollX,
      });
    }
    if (visible) {
      handleReposition();
      window.addEventListener("scroll", handleReposition, true);
      window.addEventListener("resize", handleReposition);
    }
    return () => {
      window.removeEventListener("scroll", handleReposition, true);
      window.removeEventListener("resize", handleReposition);
    };
  }, [visible]);

  if (!content) {
    return <span>{children}</span>;
  }

  return (
    <span
      ref={triggerRef}
      className="inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible &&
        createPortal(
          <div
            className="pointer-events-none absolute z-50 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-700 shadow-2xl"
            style={{ position: "absolute", top: position.top, left: position.left, transform: "translate(-50%, -100%)" }}
          >
            {content}
          </div>,
          document.body
        )}
    </span>
  );
}
