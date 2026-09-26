import { createContext, type ReactNode, useContext, useEffect, useState } from "react";

/** The game is laid out on a fixed 1920x1080 stage scaled to fit the window (letterboxed). */
export const STAGE_W = 1920;
export const STAGE_H = 1080;

const StageScaleContext = createContext(1);

export function useStageScale() {
  return useContext(StageScaleContext);
}

function computeScale() {
  return Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H);
}

export default function Stage({ children }: { children: ReactNode }) {
  const [scale, setScale] = useState(computeScale);

  useEffect(() => {
    const handleResize = () => setScale(computeScale());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // the outer box has the scaled size so flex centering sees the real footprint; the
  // 1920x1080 layer inside is scaled from its top-left corner to fill it exactly
  return (
    <StageScaleContext.Provider value={scale}>
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
        <div className="relative shrink-0" style={{ width: STAGE_W * scale, height: STAGE_H * scale }}>
          <div
            className="absolute left-0 top-0"
            style={{ width: STAGE_W, height: STAGE_H, transform: `scale(${scale})`, transformOrigin: "0 0" }}
          >
            {children}
          </div>
        </div>
      </div>
    </StageScaleContext.Provider>
  );
}
