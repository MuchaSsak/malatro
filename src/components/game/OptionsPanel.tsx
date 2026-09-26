import { Trans } from "@lingui/react/macro";
import { type ReactNode, useState } from "react";

import PixelButton from "~/components/ui/PixelButton";
import { useSettings } from "~/contexts/SettingsContext";
import { GRAPHICS_ORDER, type GraphicsQuality } from "~/lib/graphics";
import { cn } from "~/lib/utils";

type OptionsPanelProps = { onClose: () => void; onMainMenu?: () => void; onAbandon?: () => void };

type Tab = "game" | "video" | "audio";

const QUALITY_LABEL: Record<GraphicsQuality, ReactNode> = {
  low: <Trans>Low</Trans>,
  medium: <Trans>Medium</Trans>,
  high: <Trans>High</Trans>,
};

const QUALITY_HINT: Record<GraphicsQuality, ReactNode> = {
  low: <Trans>Blockier background at 20 fps, no shine animations, no idle sway</Trans>,
  medium: <Trans>Background at 30 fps and lower resolution, no blur</Trans>,
  high: <Trans>Everything on, background capped at 60 fps</Trans>,
};

/** Options in Balatro's tabbed layout: game, video, audio. */
export default function OptionsPanel({ onClose, onMainMenu, onAbandon }: OptionsPanelProps) {
  const { settings, update, isFullscreen, toggleFullscreen } = useSettings();
  const [tab, setTab] = useState<Tab>("game");

  return (
    <div className="flex w-[800px] flex-col gap-4 p-6">
      <div className="tx text-center font-pixel text-5xl text-white">
        <Trans>Options</Trans>
      </div>
      <div className="flex justify-center gap-2">
        {(
          [
            ["game", <Trans key="g">Game</Trans>],
            ["video", <Trans key="v">Video</Trans>],
            ["audio", <Trans key="a">Audio</Trans>],
          ] as const
        ).map(([id, label]) => (
          <PixelButton
            key={id}
            size="sm"
            tone={tab === id ? "red" : "panel"}
            className="w-[180px]"
            onClick={() => setTab(id)}
          >
            {label}
          </PixelButton>
        ))}
      </div>

      <div className="flex min-h-[380px] flex-col gap-3">
        {tab === "game" && (
          <>
            <Row label={<Trans>Language</Trans>}>
              {(["pl", "en"] as const).map((loc) => (
                <PixelButton
                  key={loc}
                  size="sm"
                  tone={settings.locale === loc ? "red" : "panel"}
                  className="w-[140px]"
                  onClick={() => update({ locale: loc })}
                >
                  {loc === "pl" ? "Polski" : "English"}
                </PixelButton>
              ))}
            </Row>
            <Row label={<Trans>Game speed</Trans>}>
              {[0.5, 1, 2, 4].map((s) => (
                <PixelButton
                  key={s}
                  size="sm"
                  tone={settings.speed === s ? "red" : "panel"}
                  className="w-[90px]"
                  onClick={() => update({ speed: s })}
                >
                  {s}x
                </PixelButton>
              ))}
            </Row>
          </>
        )}

        {tab === "video" && (
          <>
            <div className="flex flex-col gap-2 rounded-panel bg-inset px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="tx font-pixel text-3xl text-white">
                  <Trans>Graphics</Trans>
                </span>
                <div className="flex gap-2">
                  {GRAPHICS_ORDER.map((q) => (
                    <PixelButton
                      key={q}
                      size="sm"
                      tone={settings.graphics === q ? "red" : "panel"}
                      className="w-[130px]"
                      onClick={() => update({ graphics: q })}
                    >
                      {QUALITY_LABEL[q]}
                    </PixelButton>
                  ))}
                </div>
              </div>
              <span className="font-pixel text-xl leading-tight text-white/55">{QUALITY_HINT[settings.graphics]}</span>
            </div>
            <Toggle label={<Trans>Fullscreen (F)</Trans>} isOn={isFullscreen} onToggle={toggleFullscreen} />
            <Slider label={<Trans>CRT effect</Trans>} value={settings.crt} onChange={(v) => update({ crt: v })} />
            <Toggle
              label={<Trans>Pixel cursor</Trans>}
              isOn={settings.isPixelCursor}
              onToggle={() => update({ isPixelCursor: !settings.isPixelCursor })}
            />
            <Toggle
              label={<Trans>Reduced motion</Trans>}
              isOn={settings.isReducedMotion}
              onToggle={() => update({ isReducedMotion: !settings.isReducedMotion })}
            />
          </>
        )}

        {tab === "audio" && (
          <>
            <Slider
              label={<Trans>Music</Trans>}
              value={settings.musicVolume}
              onChange={(v) => update({ musicVolume: v })}
            />
            <Slider
              label={<Trans>Sound effects</Trans>}
              value={settings.sfxVolume}
              onChange={(v) => update({ sfxVolume: v })}
            />
          </>
        )}
      </div>

      <div className="flex gap-3">
        {onAbandon && (
          <PixelButton tone="red" size="md" className="flex-1" onClick={onAbandon}>
            <Trans>Abandon run</Trans>
          </PixelButton>
        )}
        {onMainMenu && (
          <PixelButton tone="blue" size="md" className="flex-1" onClick={onMainMenu}>
            <Trans>Main menu</Trans>
          </PixelButton>
        )}
      </div>
      <PixelButton tone="orange" size="md" onClick={onClose}>
        <Trans>Back</Trans>
      </PixelButton>
      <p className="text-center font-pixel text-lg leading-tight text-white/45">
        Font m6x11 by Daniel Linssen · Music: Kevin MacLeod (incompetech.com) CC BY 4.0 — "Hep Cats", "Local Forecast -
        Elevator", "Cool Vibes", "Groove Grove", "Funkorama", "Backbay Lounge", "Chill Wave", "Bossa Antigua", "Lobby
        Time", "Sidewalk Shade" · SFX Kenney (CC0) · Background: React Bits Balatro · Tasks: CKE
      </p>
    </div>
  );
}

function Row({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-panel bg-inset px-4 py-3">
      <span className="tx font-pixel text-3xl text-white">{label}</span>
      <div className="flex gap-2">{children}</div>
    </div>
  );
}

function Toggle({ label, isOn, onToggle }: { label: ReactNode; isOn: boolean; onToggle: () => void }) {
  return (
    <Row label={label}>
      <PixelButton size="sm" tone={isOn ? "green" : "panel"} className="w-[140px]" onClick={onToggle}>
        {isOn ? <Trans>On</Trans> : <Trans>Off</Trans>}
      </PixelButton>
    </Row>
  );
}

function Slider({ label, value, onChange }: { label: ReactNode; value: number; onChange: (v: number) => void }) {
  return (
    <Row label={label}>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className={cn("h-3 w-[300px] cursor-pointer accent-red")}
        />
        <span className="tx w-[70px] text-right font-pixel text-2xl text-white">{Math.round(value * 100)}%</span>
      </div>
    </Row>
  );
}
