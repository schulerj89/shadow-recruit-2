import type { RectSpec, Vec2 } from './types';

export function vec(x: number, z: number): Vec2 {
  return { x, z };
}

export function add(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, z: a.z + b.z };
}

export function subtract(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x - b.x, z: a.z - b.z };
}

export function scale(v: Vec2, amount: number): Vec2 {
  return { x: v.x * amount, z: v.z * amount };
}

export function length(v: Vec2): number {
  return Math.hypot(v.x, v.z);
}

export function distance(a: Vec2, b: Vec2): number {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

export function normalize(v: Vec2): Vec2 {
  const len = length(v);
  return len > 0.00001 ? { x: v.x / len, z: v.z / len } : { x: 0, z: 1 };
}

export function lerp(a: Vec2, b: Vec2, t: number): Vec2 {
  return { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function pointInRect(point: Vec2, rect: RectSpec, padding = 0): boolean {
  const halfX = rect.size.x / 2 + padding;
  const halfZ = rect.size.z / 2 + padding;
  return (
    point.x >= rect.center.x - halfX &&
    point.x <= rect.center.x + halfX &&
    point.z >= rect.center.z - halfZ &&
    point.z <= rect.center.z + halfZ
  );
}

export function pointInBounds(point: Vec2, bounds: { min: Vec2; max: Vec2 }, padding = 0): boolean {
  return (
    point.x >= bounds.min.x + padding &&
    point.x <= bounds.max.x - padding &&
    point.z >= bounds.min.z + padding &&
    point.z <= bounds.max.z - padding
  );
}
