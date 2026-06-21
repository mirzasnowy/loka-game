"use client";

/**
 * Single input layer. Keyboard, mouse and on-screen mobile controls all write
 * here; gameplay systems read here. Continuous state (move/run/block) are
 * flags; one-shot actions (interact/punch/dodge) are edge-triggered and
 * consumed once so a tap fires exactly one action.
 */

export type Action = "interact" | "punch" | "kick" | "dodge" | "jump" | "fire" | "reload" | "swap" | "inv";

class InputState {
  move = { x: 0, y: 0 }; // x: strafe (-1..1), y: forward (-1..1)
  run = false;
  block = false;
  lookDx = 0; // accumulated horizontal look delta, consumed by camera
  lookDy = 0; // accumulated vertical look delta (pitch), consumed by camera
  iframeUntil = 0; // performance.now() ms until which dodge grants invulnerability
  private pressed = new Set<Action>();
  private bound = false;

  press(a: Action) {
    this.pressed.add(a);
  }
  consume(a: Action): boolean {
    if (this.pressed.has(a)) {
      this.pressed.delete(a);
      return true;
    }
    return false;
  }
  takeLook(): number {
    const d = this.lookDx;
    this.lookDx = 0;
    return d;
  }
  takeLookY(): number {
    const d = this.lookDy;
    this.lookDy = 0;
    return d;
  }
  /** Mobile look pad: accumulate a drag delta in pixels. */
  addLook(dxPx: number, dyPx: number) {
    this.lookDx += dxPx * 0.006;
    this.lookDy += dyPx * 0.006;
  }

  bind() {
    if (this.bound || typeof window === "undefined") return;
    this.bound = true;
    const keys: Record<string, boolean> = {};

    const down = (e: KeyboardEvent) => {
      keys[e.code] = true;
      this.updateMove(keys);
      if (e.code === "ShiftLeft" || e.code === "ShiftRight") this.run = true;
      if (e.code === "KeyB") this.block = true;
      if (e.code === "Space") this.press("jump");
      if (e.code === "KeyE") this.press("interact");
      if (e.code === "KeyJ") this.press("punch");
      if (e.code === "KeyK") this.press("kick");
      if (e.code === "ControlLeft") this.press("dodge");
      if (e.code === "KeyF") this.press("fire");
      if (e.code === "KeyR") this.press("reload");
      if (e.code === "KeyQ") this.press("swap");
      if (e.code === "KeyI" || e.code === "Tab") { e.preventDefault(); this.press("inv"); }
    };
    const up = (e: KeyboardEvent) => {
      keys[e.code] = false;
      this.updateMove(keys);
      if (e.code === "ShiftLeft" || e.code === "ShiftRight") this.run = false;
      if (e.code === "KeyB") this.block = false;
    };

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);

    // Mouse: drag to look (both axes), RMB block. Touch look handled by HUD pad.
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    window.addEventListener("pointerdown", (e) => {
      if ((e.target as HTMLElement)?.dataset?.ui) return; // ignore UI buttons/pads
      if (e.pointerType === "touch") return; // mobile uses the look pad
      if (e.button === 2) this.block = true;
      else {
        dragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
      }
    });
    window.addEventListener("pointermove", (e) => {
      if (dragging) {
        this.lookDx += (e.clientX - lastX) * 0.005;
        this.lookDy += (e.clientY - lastY) * 0.005;
        lastX = e.clientX;
        lastY = e.clientY;
      }
    });
    window.addEventListener("pointerup", (e) => {
      if (e.button === 2) this.block = false;
      dragging = false;
    });
    window.addEventListener("contextmenu", (e) => e.preventDefault());
  }

  private updateMove(keys: Record<string, boolean>) {
    const f = (keys["KeyW"] || keys["ArrowUp"] ? 1 : 0) - (keys["KeyS"] || keys["ArrowDown"] ? 1 : 0);
    const s = (keys["KeyD"] || keys["ArrowRight"] ? 1 : 0) - (keys["KeyA"] || keys["ArrowLeft"] ? 1 : 0);
    // Keyboard overrides analog stick only when keys are pressed.
    if (f !== 0 || s !== 0 || (!this.touchMoving)) {
      this.move.y = f;
      this.move.x = s;
    }
  }

  // mobile joystick writes these directly
  touchMoving = false;
  setStick(x: number, y: number) {
    this.touchMoving = x !== 0 || y !== 0;
    this.move.x = x;
    this.move.y = y;
  }
}

export const input = new InputState();
