/** Pixel corner-brackets icon: pointing out (enter fullscreen) or in (leave it). */
export default function FullscreenIcon({ isIn = false, size = 28 }: { isIn?: boolean; size?: number }) {
  // one bracket in the top-left corner; the other three are rotations of it
  const bracket = isIn ? "M5 0h2v7H0V5h5z" : "M0 0h7v2H2v5H0z";
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" shapeRendering="crispEdges" fill="currentColor" aria-hidden>
      {[0, 90, 180, 270].map((deg) => (
        <path key={deg} d={bracket} transform={`rotate(${deg} 8 8)`} />
      ))}
    </svg>
  );
}
