import { AnimatePresence, motion } from "motion/react";
import { type ReactNode, useEffect } from "react";

import { cn } from "~/lib/utils";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  /** light rim like Balatro's overlay panels */
  isRimmed?: boolean;
  /** false: clicks on the scrim do nothing (only the panel's own buttons or Escape close it) */
  isScrimClosable?: boolean;
};

/** Stage-space modal: dark scrim, panel pops in, Escape closes. */
export default function Modal({
  isOpen,
  onClose,
  children,
  className,
  isRimmed = true,
  isScrimClosable = true,
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="absolute inset-0 z-[200] grid place-items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* scrim bleeds past the 16:9 stage so letterbox bands darken too */}
          <div className="absolute -inset-[1500px] bg-black/55" onPointerDown={isScrimClosable ? onClose : undefined} />
          <motion.div
            initial={{ scale: 0.8, y: 40 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className={cn("relative", isRimmed && "rounded-[22px] bg-outline p-[5px] shadow-hard", className)}
          >
            <div className={cn(isRimmed && "rounded-[18px] bg-panel")}>{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
