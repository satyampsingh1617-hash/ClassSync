/**
 * Geofence utility — RKT College campus gate
 * Center: 19.227926, 73.161258 | Radius: 300 metres
 */

const CAMPUS = {
  lat:    19.227926,
  lng:    73.161258,
  radius: 300,          // metres
};

/**
 * Haversine formula — returns distance in metres between two lat/lng points.
 */
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R   = 6371000; // Earth radius in metres
  const φ1  = (lat1 * Math.PI) / 180;
  const φ2  = (lat2 * Math.PI) / 180;
  const Δφ  = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ  = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c); // metres, rounded
}

/**
 * Returns { inside: bool, distance: metres }
 */
function checkGeofence(lat, lng) {
  const distance = haversineDistance(CAMPUS.lat, CAMPUS.lng, lat, lng);
  return {
    inside:   distance <= CAMPUS.radius,
    distance, // metres from campus gate
    campus:   CAMPUS,
  };
}

module.exports = { checkGeofence, CAMPUS };
