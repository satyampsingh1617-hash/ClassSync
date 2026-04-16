/**
 * useGeofence — Vue composable for permission-first location + geofence logic.
 * Campus: RKT College gate (Updated) | Coordinates: 19.227926, 73.161258 | Radius: 300m
 */

const CAMPUS_LAT    = 19.22877599529906
const CAMPUS_LNG    = 73.16150695815026
const CAMPUS_RADIUS = 200       // metres — must be within 500m of campus
const GPS_TIMEOUT   = 15000     // Increase timeout for better stability

// Returns distance in METRES between two lat/lng points
function haversine(lat1, lng1, lat2, lng2) {
  const R  = 6371000  // Earth radius in metres
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

/** True when running inside the Capacitor native shell (Android/iOS app) */
const isNativeApp = () =>
  typeof window !== 'undefined' &&
  !!(window.Capacitor?.isNativePlatform?.() || window.Capacitor?.platform)

// ── Native path (Capacitor) ───────────────────────────────────────────────────
async function requestLocationNative() {
  const { Geolocation } = await import('@capacitor/geolocation')

  // Always check current status first
  let permStatus = await Geolocation.checkPermissions()

  if (permStatus.location === 'denied') {
    throw new GeofenceError(
      'PERMISSION_DENIED',
      'Location permission denied. Please allow location access in your phone settings.'
    )
  }

  if (permStatus.location !== 'granted') {
    permStatus = await Geolocation.requestPermissions({ permissions: ['location'] })
  }

  if (permStatus.location !== 'granted') {
    throw new GeofenceError(
      'PERMISSION_DENIED',
      'Location permission denied. Please allow location access in your phone settings.'
    )
  }

  let position;
  try {
    // Attempt 1: High Accuracy (GPS)
    position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: GPS_TIMEOUT,
    });
  } catch (e) {
    try {
      // Attempt 2: Fallback to Network (Cell/Wi-Fi)
      console.warn("GPS failed, trying network location...");
      position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: false,
        timeout: 10000,
      });
    } catch (e2) {
      if (e2.message?.toLowerCase().includes('location disabled') || e2.message?.toLowerCase().includes('gps')) {
        throw new GeofenceError('GPS_OFF', 'Your phone\'s Location Services (GPS) are turned off. Please turn them on in settings.');
      }
      throw new GeofenceError('TIMEOUT', 'Poor GPS signal. Please move to an open area or outdoors and try again.');
    }
  }

  const { latitude, longitude, accuracy } = position.coords;
  const isMockLocation = !!(position.coords.isMockLocation) || false;
  const isProxy = false
  const distance = haversine(CAMPUS_LAT, CAMPUS_LNG, latitude, longitude)  // metres

  return { latitude, longitude, accuracy, isMockLocation, isProxy, distance, insideCampus: distance <= CAMPUS_RADIUS }
}

// ── Web path (browser navigator.geolocation) ─────────────────────────────────
function requestLocationWeb() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new GeofenceError('POSITION_ERROR', 'Geolocation is not supported by your browser.'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords
        const isMockLocation = false
        const isProxy = false
        const distance = haversine(CAMPUS_LAT, CAMPUS_LNG, latitude, longitude)  // metres
        resolve({
          latitude,
          longitude,
          accuracy,
          isMockLocation,
          isProxy,
          distance,
          insideCampus: distance <= CAMPUS_RADIUS,
        })
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          reject(new GeofenceError(
            'PERMISSION_DENIED',
            'Location permission denied. Please allow location access in your browser settings.'
          ))
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          reject(new GeofenceError('GPS_OFF', 'Location unavailable. Please enable GPS.'))
        } else if (err.code === err.TIMEOUT) {
          reject(new GeofenceError('TIMEOUT', 'Poor GPS signal. Move to an open area and try again.'))
        } else {
          reject(new GeofenceError('POSITION_ERROR', 'Could not determine your location. Please try again.'))
        }
      },
      { enableHighAccuracy: true, timeout: GPS_TIMEOUT, maximumAge: 0 }
    )
  })
}

// ── Public API ────────────────────────────────────────────────────────────────
export async function requestLocation() {
  try {
    if (isNativeApp()) {
      return await requestLocationNative()
    } else {
      return await requestLocationWeb()
    }
  } catch (err) {
    if (err instanceof GeofenceError) throw err
    console.error("Location engine error:", err);
    throw new GeofenceError('POSITION_ERROR', 'Location Error: ' + (err.message || 'Please check your GPS settings and try again.'));
  }
}

export { CAMPUS_LAT, CAMPUS_LNG, CAMPUS_RADIUS }
