import { describe, expect, it } from 'vitest';
import { distanceInMeters, findNearbyPlaces } from './geolocation';

describe('Nearby saved places', () => {
  const position = { latitude: 44.8176, longitude: 20.4633 };
  const places = [
    { id: 'far', name: 'Far away', latitude: 44.8196, longitude: 20.4633 },
    { id: 'near', name: 'Near', latitude: 44.8181, longitude: 20.4633 },
    { id: 'nearest', name: 'Nearest', latitude: 44.8177, longitude: 20.4633 },
  ];

  it('offers places within 100 meters in order of proximity', () => {
    expect(findNearbyPlaces(position, places).map(({ id }) => id)).toEqual(['nearest', 'near']);
    expect(places.map(({ id }) => id)).toEqual(['far', 'near', 'nearest']);
  });

  it('does not suggest places without a valid current position', () => {
    expect(findNearbyPlaces(null, places)).toEqual([]);
    expect(findNearbyPlaces({ latitude: 91, longitude: 20 }, places)).toEqual([]);
  });

  it('ignores saved places with invalid coordinates', () => {
    expect(findNearbyPlaces(position, [{ ...places[0], latitude: NaN }])).toEqual([]);
  });

  it('measures nearby points across the date line', () => {
    const distance = distanceInMeters({ latitude: 0, longitude: 179.9999 }, { latitude: 0, longitude: -179.9999 });
    expect(distance).toBeGreaterThan(22);
    expect(distance).toBeLessThan(23);
  });
});
