import type { SafeRoute, SimulationSnapshot } from "./types.ts";

let current: SimulationSnapshot | undefined;
const cascadesById = new Map<string, SimulationSnapshot["cascades"][number]>();
let lastRoute: SafeRoute | undefined;

export function saveSnapshot(snapshot: SimulationSnapshot): void {
  current = snapshot;
  cascadesById.clear();
  for (const cascade of snapshot.cascades) {
    cascadesById.set(cascade.eventId, cascade);
  }
}

export function getSnapshot(): SimulationSnapshot | undefined {
  return current;
}

export function getCascade(eventId: string) {
  return cascadesById.get(eventId);
}

export function saveRoute(route: SafeRoute): void {
  lastRoute = route;
}

export function getRoute(): SafeRoute | undefined {
  return lastRoute;
}
