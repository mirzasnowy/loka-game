/**
 * Camera view mode shared flag. Player reads it for camera placement; HUD toggles
 * it. Decoupled like `input`/`avatar` so no component owns another.
 */
export const view = { mode: "tps" as "tps" | "fps" };
