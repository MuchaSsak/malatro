/**
 * Balatro paint-swirl background. Adapted from React Bits "Balatro" (MIT + Commons Clause,
 * (c) David Haz, https://reactbits.dev/backgrounds/balatro), itself a port of LocalThunk's shader.
 * Change vs. upstream: the WebGL context is created once and colours/speed ease toward new
 * targets through uniforms, so blind/boss colour changes animate instead of rebuilding the canvas.
 */
import { Mesh, Program, Renderer, Triangle } from "ogl";
import { useEffect, useRef } from "react";

import { GRAPHICS, type GraphicsProfile } from "~/lib/graphics";

export type SwirlPalette = { c1: string; c2: string; c3: string; speed: number; contrast: number; lighting: number };

export const PALETTES = {
  menu: { c1: "#DE443B", c2: "#006BB4", c3: "#162325", speed: 5, contrast: 3.5, lighting: 0.4 },
  blind: { c1: "#3F7A60", c2: "#2A5745", c3: "#1B3A2F", speed: 2.2, contrast: 1.6, lighting: 0.25 },
  shop: { c1: "#3F7A60", c2: "#2A5745", c3: "#1B3A2F", speed: 1.6, contrast: 1.6, lighting: 0.2 },
  sciagi: { c1: "#7A58A8", c2: "#4A3470", c3: "#2A1D40", speed: 2.5, contrast: 2, lighting: 0.3 },
  twierdzenia: { c1: "#1d5a80", c2: "#0e2a44", c3: "#050d18", speed: 1.5, contrast: 2.2, lighting: 0.35 },
  jokery: { c1: "#b8962e", c2: "#6e5a1e", c3: "#2a200c", speed: 2.5, contrast: 2, lighting: 0.3 },
  zadania: { c1: "#4f6367", c2: "#2c383c", c3: "#1c2426", speed: 2, contrast: 1.8, lighting: 0.25 },
  gameover: { c1: "#E85450", c2: "#8a2a26", c3: "#3a1210", speed: 1.2, contrast: 2, lighting: 0.3 },
  won: { c1: "#009DFF", c2: "#4BC292", c3: "#162325", speed: 3, contrast: 3, lighting: 0.4 },
} satisfies Record<string, SwirlPalette>;

export function bossPalette(color: string): SwirlPalette {
  return { c1: color, c2: shade(color, 0.55), c3: shade(color, 0.25), speed: 2.6, contrast: 2, lighting: 0.3 };
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255];
}

function shade(hex: string, f: number): string {
  const [r, g, b] = hexToRgb(hex);
  const to = (v: number) =>
    Math.round(Math.max(0, Math.min(1, v * f)) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

const VERTEX = `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position, 0, 1); }
`;

const FRAGMENT = `
precision highp float;
uniform float iTime;
uniform vec3 iResolution;
uniform float uSpinRotation;
uniform float uSpinSpeed;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform float uContrast;
uniform float uLighting;
uniform float uSpinAmount;
uniform float uPixelFilter;
uniform float uSpinEase;
uniform vec2 uMouse;
varying vec2 vUv;

vec4 effect(vec2 screenSize, vec2 screen_coords) {
  float pixel_size = length(screenSize.xy) / uPixelFilter;
  vec2 uv = (floor(screen_coords.xy * (1.0 / pixel_size)) * pixel_size - 0.5 * screenSize.xy) / length(screenSize.xy);
  float uv_len = length(uv);
  float speed = (uSpinRotation * uSpinEase * 0.2) + 302.2;
  float mouseInfluence = (uMouse.x * 2.0 - 1.0);
  speed += mouseInfluence * 0.1;
  float new_pixel_angle = atan(uv.y, uv.x) + speed - uSpinEase * 20.0 * (uSpinAmount * uv_len + (1.0 - uSpinAmount));
  vec2 mid = (screenSize.xy / length(screenSize.xy)) / 2.0;
  uv = (vec2(uv_len * cos(new_pixel_angle) + mid.x, uv_len * sin(new_pixel_angle) + mid.y) - mid);
  uv *= 30.0;
  speed = iTime + mouseInfluence * 2.0;
  vec2 uv2 = vec2(uv.x + uv.y);
  for (int i = 0; i < 5; i++) {
    uv2 += sin(max(uv.x, uv.y)) + uv;
    uv += 0.5 * vec2(cos(5.1123314 + 0.353 * uv2.y + speed * 0.131121), sin(uv2.x - 0.113 * speed));
    uv -= cos(uv.x + uv.y) - sin(uv.x * 0.711 - uv.y);
  }
  float contrast_mod = (0.25 * uContrast + 0.5 * uSpinAmount + 1.2);
  float paint_res = min(2.0, max(0.0, length(uv) * 0.035 * contrast_mod));
  float c1p = max(0.0, 1.0 - contrast_mod * abs(1.0 - paint_res));
  float c2p = max(0.0, 1.0 - contrast_mod * abs(paint_res));
  float c3p = 1.0 - min(1.0, c1p + c2p);
  float light = (uLighting - 0.2) * max(c1p * 5.0 - 4.0, 0.0) + uLighting * max(c2p * 5.0 - 4.0, 0.0);
  vec3 col = (0.3 / uContrast) * uColor1 + (1.0 - 0.3 / uContrast) * (uColor1 * c1p + uColor2 * c2p + c3p * uColor3) + light;
  // Balatro's post-CRT grade (+6% contrast, +12% saturation), done here instead of a CSS
  // filter on the whole scene, which would re-composite every layer every frame
  float grey = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(vec3(grey), col, 1.12);
  col = (col - 0.5) * 1.06 + 0.5;
  return vec4(col, 1.0);
}

void main() { gl_FragColor = effect(iResolution.xy, vUv * iResolution.xy); }
`;

function createSwirl(initial: SwirlPalette) {
  try {
    const renderer = new Renderer({ dpr: 1 });
    const gl = renderer.gl;
    if (!gl) return null;
    const program = new Program(gl, {
      vertex: VERTEX,
      fragment: FRAGMENT,
      uniforms: {
        iTime: { value: 0 },
        iResolution: { value: [1, 1, 1] },
        uSpinRotation: { value: -2 },
        uSpinSpeed: { value: initial.speed },
        uColor1: { value: hexToRgb(initial.c1) },
        uColor2: { value: hexToRgb(initial.c2) },
        uColor3: { value: hexToRgb(initial.c3) },
        uContrast: { value: initial.contrast },
        uLighting: { value: initial.lighting },
        uSpinAmount: { value: 0.25 },
        uPixelFilter: { value: 700 },
        uSpinEase: { value: 1 },
        uMouse: { value: [0.5, 0.5] },
      },
    });
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });
    return { renderer, program, mesh };
  } catch {
    return null;
  }
}

type BalatroBackgroundProps = {
  palette: SwirlPalette;
  boost?: number;
  isPaused?: boolean;
  profile?: GraphicsProfile;
  /** something opaque-ish covers the screen (task viewer): drop the frame rate */
  isCovered?: boolean;
};

export default function BalatroBackground({
  palette,
  boost = 0,
  isPaused = false,
  profile = GRAPHICS.high,
  isCovered = false,
}: BalatroBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef({ palette, boost, isPaused, profile, isCovered });

  useEffect(() => {
    targetRef.current = { palette, boost, isPaused, profile, isCovered };
  }, [palette, boost, isPaused, profile, isCovered]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const swirl = createSwirl(targetRef.current.palette);
    // no WebGL (old GPU, blocked drivers): the container's CSS gradient stays as the background
    if (!swirl) return;
    const { renderer, program, mesh } = swirl;
    const gl = renderer.gl;
    // The shader quantises to ~3px blocks anyway, so the canvas renders at 1/downscale of the
    // window and CSS upscales it pixelated: same look, a fraction of the fragment work.
    let downscale = 0;
    const resize = () => {
      downscale = targetRef.current.profile.bgDownscale;
      renderer.setSize(
        Math.max(1, Math.ceil(container.offsetWidth / downscale)),
        Math.max(1, Math.ceil(container.offsetHeight / downscale)),
      );
      gl.canvas.style.width = "100%";
      gl.canvas.style.height = "100%";
      program.uniforms.iResolution.value = [gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height];
    };
    window.addEventListener("resize", resize);
    resize();
    container.appendChild(gl.canvas);

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    let raf = 0;
    let last = performance.now();
    let lastDraw = 0;
    let flow = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const target = targetRef.current;
      if (target.profile.bgDownscale !== downscale) resize();
      // frame cap: also keeps 120/144 Hz screens from rendering the swirl 2-3x as often
      const fps = target.isCovered ? target.profile.bgFpsCovered : target.profile.bgFps;
      if (fps <= 0 || now - lastDraw < 1000 / fps - 2) return;
      lastDraw = now;
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const k = 1 - Math.pow(0.02, dt); // ~1s ease
      for (const [key, hex] of [
        ["uColor1", target.palette.c1],
        ["uColor2", target.palette.c2],
        ["uColor3", target.palette.c3],
      ] as const) {
        const cur = program.uniforms[key].value as number[];
        const to = hexToRgb(hex);
        program.uniforms[key].value = cur.map((v, i) => lerp(v, to[i], k));
      }
      program.uniforms.uContrast.value = lerp(program.uniforms.uContrast.value, target.palette.contrast, k);
      program.uniforms.uLighting.value = lerp(
        program.uniforms.uLighting.value,
        target.palette.lighting + target.boost * 0.15,
        k,
      );
      const speed = target.isPaused ? 0.2 : target.palette.speed * (1 + target.boost * 2);
      program.uniforms.uSpinSpeed.value = lerp(program.uniforms.uSpinSpeed.value, speed, k);
      flow += dt * program.uniforms.uSpinSpeed.value;
      program.uniforms.iTime.value = flow;
      renderer.render({ scene: mesh });
    };
    raf = requestAnimationFrame(loop);

    const handleMouse = (e: MouseEvent) => {
      program.uniforms.uMouse.value = [e.clientX / window.innerWidth, 1 - e.clientY / window.innerHeight];
    };
    window.addEventListener("mousemove", handleMouse);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouse);
      container.removeChild(gl.canvas);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="pixelated absolute inset-0 [&>canvas]:block"
      style={{
        background: `radial-gradient(ellipse at 30% 35%, ${palette.c1}, transparent 65%), radial-gradient(ellipse at 75% 70%, ${palette.c2}, transparent 60%), ${palette.c3}`,
      }}
      aria-hidden
    />
  );
}
