import { cn } from "~/lib/utils";

const cache = new Map<string, string>();

/**
 * Turns an emoji or short glyph into chunky pixel art: drawn tiny on a canvas, then upscaled
 * with nearest-neighbour. Gives joker/consumable art the Balatro sprite look without sprites.
 */
function toPixelDataUrl(glyph: string, res: number, color: string): string {
  const key = `${glyph}|${res}|${color}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const canvas = document.createElement("canvas");
  canvas.width = res;
  canvas.height = res;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  const isEmoji = /\p{Extended_Pictographic}/u.test(glyph);
  const len = [...glyph].length;
  const size = isEmoji ? res * 0.82 : res * (len <= 1 ? 0.8 : len <= 2 ? 0.58 : len <= 3 ? 0.44 : 0.34);
  ctx.font = `${size}px ${isEmoji ? '"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif' : "m6x11plus, monospace"}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if (!isEmoji) {
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillText(glyph, res / 2 + 1, res / 2 + 2);
  }
  ctx.fillStyle = color;
  ctx.fillText(glyph, res / 2, res / 2 + (isEmoji ? res * 0.04 : 0));
  // hard alpha threshold so edges stay pixel-crisp
  const img = ctx.getImageData(0, 0, res, res);
  for (let i = 3; i < img.data.length; i += 4) img.data[i] = img.data[i] > 90 ? 255 : 0;
  ctx.putImageData(img, 0, 0);
  const url = canvas.toDataURL();
  cache.set(key, url);
  return url;
}

type PixelArtProps = { glyph: string; size: number; res?: number; color?: string; className?: string };

export default function PixelArt({ glyph, size, res = 28, color = "#374244", className }: PixelArtProps) {
  const src = toPixelDataUrl(glyph, res, color);
  return (
    <img
      src={src}
      width={size}
      height={size}
      alt=""
      draggable={false}
      className={cn("pixelated pointer-events-none", className)}
    />
  );
}
