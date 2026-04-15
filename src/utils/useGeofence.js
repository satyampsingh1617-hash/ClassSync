/**
 * useGeofence — Vue composable for permission-first location + geofence logic.
 * Campus: RKT College gate  19.227770, 73.161263  |  Radius: 100m
 */

const CAMPUS_LAT    = 19.227770
const CAMPUS_LNG    = 73.161263
const CAMPUS_RADIUS = 100       // metres
const GPS_TIMEOUT   = 10000     // 10 seconds

function haversine(lat1, lng1, lat2, lng2) {
  const R  = 6371000
  const p1 = (lat1 * Math.PI) / 180
  const p2 = (lat2 * Math.PI) / 180
  const dp = ((lat2 - lat1) * Math.PI) / 180
  const dl = ((lng2 - lng1) * Math.PI) / 180
  const a  = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}

export class GeofenceError extends Error {
  constructor(code, message) {
    super(message)
    this.code = code
  }
}

import { Geolocation } from '@capacitor/geolocation';

export async function requestLocation() {
  try {
    // Check/Request permissions natively
    const permStatus = await Geolocation.requestPermissions();
    if (permStatus.location === 'denied') {
      throw new GeofenceError('PERMISSION_DENIED', 'Location permission denied. Please allow location access in your phone settings.');
    }

    // Fetch position natively (bypasses browser WebView restrictions)
    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: GPS_TIMEOUT
    });

    const { latitude, longitude, accuracy } = position.coords;

    // Capacitor marks mock locations automatically on Android
    const isMockLocation = position.coords.isMockLocation || (accuracy === 0);
    const isProxy = false;

    const distance = haversine(CAMPUS_LAT, CAMPUS_LNG, latitude, longitude);
    const insideCampus = distance <= CAMPUS_RADIUS;

    return { latitude, longitude, accuracy, isMockLocation, isProxy, distance, insideCampus };
  } catch (err) {
    if (err instanceof GeofenceError) throw err;

    // Map Capacitor errors to your existing UI codes
    if (err.message?.includes('denied')) {
      throw new GeofenceError('PERMISSION_DENIED', 'Location permission denied.');
    } else if (err.message?.includes('location disabled') || err.message?.includes('GPS')) {
      throw new GeofenceError('GPS_OFF', 'Please enable GPS / Location Services on your phone.');
    } else if (err.message?.includes('timeout')) {
      throw new GeofenceError('TIMEOUT', 'Poor GPS signal. Please move to an open area and try again.');
    }

    throw new GeofenceError('POSITION_ERROR', 'Could not determine your location. Please try again.');
  }
}

export { CAMPUS_LAT, CAMPUS_LNG, CAMPUS_RADIUS }
