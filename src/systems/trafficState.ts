/**
 * Shared traffic-signal phase. TrafficSystem advances it; TrafficLights renders
 * it; both stay in sync. phase 0 = N-S (z-axis) green, phase 1 = E-W (x) green.
 */
export const traffic = { phase: 0 as 0 | 1, timer: 8 };
export const GREEN_TIME = 7;
export const YELLOW_TIME = 1.5;
