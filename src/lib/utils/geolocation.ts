import type { KnownPlace } from '$lib/data/interfaces';

export type Coordinates = { latitude: number; longitude: number };

export function isValidCoordinates(latitude: number, longitude: number) {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

export function distanceInMeters(from: Coordinates, to: Coordinates) {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDelta = radians(to.latitude - from.latitude);
  const longitudeDelta = radians(to.longitude - from.longitude);
  const value =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(radians(from.latitude)) * Math.cos(radians(to.latitude)) * Math.sin(longitudeDelta / 2) ** 2;
  return 6371000 * 2 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, value))));
}

export function findNearbyPlaces(position: Coordinates | null, places: KnownPlace[], radius = 100) {
  if (!position || !isValidCoordinates(position.latitude, position.longitude)) return [];
  return places
    .filter((place) => isValidCoordinates(place.latitude, place.longitude))
    .map((place) => ({ place, distance: distanceInMeters(position, place) }))
    .filter(({ distance }) => distance <= radius)
    .sort((a, b) => a.distance - b.distance)
    .map(({ place }) => place);
}
