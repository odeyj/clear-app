import {
  ALTERNATIVE_SEARCH_RADIUS_KM,
  ALTERNATIVE_MAX_RESULTS,
  CRUISE_SPEED_KMH,
  haversineDistance,
  getRiskLevel,
  concatGeoJSONLineStrings,
} from '@frcs/shared';
import type { AlternativeRoute, AirportSearchResult } from '@frcs/shared';
import { getAirportByCode, getMajorAirportsInRadius } from '../services/airports.service.js';
import { scoreRoute } from './route-scorer.js';

/** Great-circle distance above which US/Canada–India trips get curated EU hub suggestions */
const LONG_HAUL_NA_INDIA_MIN_KM = 9_000;
const NORTH_AMERICA_ORIGIN = new Set(['US', 'CA']);
const LONG_HAUL_ALT_CAP = 5;

/** Typical EU stops marketed for US ↔ South Asia (order = usual preference) */
const EU_HUBS_US_INDIA = ['LHR', 'FRA', 'CDG', 'AMS', 'FCO'] as const;

const EU_HUB_BLURBS: Record<string, string> = {
  LHR: 'Heathrow is the most common European stop on US–India itineraries (oneworld / joint ventures with British Airways and US carriers).',
  FRA: 'Frankfurt is a primary Star Alliance gateway (Lufthansa) with daily-style connectivity toward India.',
  CDG: 'Paris CDG is a major SkyTeam hub (Air France); realistic for US East Coast connects to South India.',
  AMS: 'Schiphol (KLM) frequently appears on US–EU–India tickets via SkyTeam and partner metal.',
  FCO: 'Rome is a plausible second EU touchpoint on alliance or seasonal routings before the long India segment.',
};

function qualifiesNorthAmericaToIndiaLongHaul(
  origin: AirportSearchResult,
  destination: AirportSearchResult,
  directDistKm: number
): boolean {
  if (directDistKm < LONG_HAUL_NA_INDIA_MIN_KM) return false;
  if (!NORTH_AMERICA_ORIGIN.has(origin.country)) return false;
  if (destination.country !== 'IN') return false;
  return true;
}

/**
 * Curated one-stop EU layovers for very long North America → India routes (e.g. BOS–BLR).
 * Always included when qualified so users see realistic airline patterns, not only “safer” detours.
 */
export function buildLongHaulEuropeIndiaLayovers(
  origin: AirportSearchResult,
  destination: AirportSearchResult,
  directDistKm: number
): AlternativeRoute[] {
  if (!qualifiesNorthAmericaToIndiaLongHaul(origin, destination, directDistKm)) {
    return [];
  }

  const results: AlternativeRoute[] = [];
  const oLat = origin.latitude;
  const oLon = origin.longitude;
  const dLat = destination.latitude;
  const dLon = destination.longitude;

  for (const hubCode of EU_HUBS_US_INDIA) {
    const hub = getAirportByCode(hubCode);
    if (!hub) continue;

    const leg1 = scoreRoute(oLat, oLon, hub.latitude, hub.longitude, `via ${hub.iataCode} (1)`);
    const leg2 = scoreRoute(hub.latitude, hub.longitude, dLat, dLon, `via ${hub.iataCode} (2)`);
    const combinedScore = Math.round((leg1.score + leg2.score) / 2);
    const totalDist = leg1.distanceKm + leg2.distanceKm;
    const extraDist = totalDist - directDistKm;
    const extraTime = Math.round((extraDist / CRUISE_SPEED_KMH) * 60) + 75;

    const blurb = EU_HUB_BLURBS[hubCode] || `Connection via ${hub.municipality} is used on published US–India one-stop routings.`;

    results.push({
      id: `alt-eu-${hub.iataCode.toLowerCase()}`,
      description: `One stop: ${origin.iataCode} → ${hub.iataCode} → ${destination.iataCode}`,
      via: hub.iataCode,
      viaLatitude: hub.latitude,
      viaLongitude: hub.longitude,
      path: concatGeoJSONLineStrings(leg1.path, leg2.path),
      score: combinedScore,
      riskLevel: getRiskLevel(100 - combinedScore),
      distanceKm: Math.round(totalDist),
      extraDistanceKm: Math.round(extraDist),
      extraTimeMinutes: extraTime,
      stops: 1,
      reasoning: `${blurb} Adds about ${Math.round(extraDist)} km vs great-circle and roughly ${extraTime} minutes block-to-block including a typical EU connection.`,
    });
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, LONG_HAUL_ALT_CAP);
}

/** Prefer curated EU–India layovers when both lists mention the same hub (richer copy). */
export function mergeLayoverAlternatives(
  riskBased: AlternativeRoute[],
  europeIndia: AlternativeRoute[]
): AlternativeRoute[] {
  const cap = europeIndia.length > 0 ? LONG_HAUL_ALT_CAP : ALTERNATIVE_MAX_RESULTS;
  const byVia = new Map<string, AlternativeRoute>();

  for (const a of europeIndia) {
    byVia.set(a.via, a);
  }
  for (const a of riskBased) {
    if (!byVia.has(a.via)) {
      byVia.set(a.via, a);
    }
  }

  return [...byVia.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, cap);
}

export function findAlternatives(
  originLat: number, originLon: number,
  destLat: number, destLon: number,
  originCode: string, destCode: string,
  directScore: number
): AlternativeRoute[] {
  const directDist = haversineDistance(originLat, originLon, destLat, destLon);
  const candidates: AlternativeRoute[] = [];

  // Find hub airports between origin and destination
  const midLat = (originLat + destLat) / 2;
  const midLon = (originLon + destLon) / 2;

  const hubAirports = getMajorAirportsInRadius(midLat, midLon, ALTERNATIVE_SEARCH_RADIUS_KM, 30);

  // Also search near origin and destination for different hub connections
  const nearOrigin = getMajorAirportsInRadius(originLat, originLon, ALTERNATIVE_SEARCH_RADIUS_KM, 10);
  const nearDest = getMajorAirportsInRadius(destLat, destLon, ALTERNATIVE_SEARCH_RADIUS_KM, 10);
  const allHubs = [...hubAirports, ...nearOrigin, ...nearDest];

  // Deduplicate
  const seen = new Set<string>();
  const uniqueHubs = allHubs.filter(h => {
    if (seen.has(h.iataCode)) return false;
    if (h.iataCode === originCode || h.iataCode === destCode) return false;
    seen.add(h.iataCode);
    return true;
  });

  for (const hub of uniqueHubs) {
    // Score the two-leg route through this hub
    const leg1 = scoreRoute(originLat, originLon, hub.latitude, hub.longitude, `via ${hub.iataCode} (leg 1)`);
    const leg2 = scoreRoute(hub.latitude, hub.longitude, destLat, destLon, `via ${hub.iataCode} (leg 2)`);

    const combinedScore = Math.round((leg1.score + leg2.score) / 2);
    const totalDist = leg1.distanceKm + leg2.distanceKm;
    const extraDist = totalDist - directDist;
    const extraTime = Math.round((extraDist / CRUISE_SPEED_KMH) * 60) + 60; // +60 min for connection

    // Include all viable hub connections as itinerary options
    if (combinedScore > 0) {
      candidates.push({
        id: `alt-${hub.iataCode.toLowerCase()}`,
        description: `One stop: ${originCode} → ${hub.iataCode} → ${destCode}`,
        via: hub.iataCode,
        viaLatitude: hub.latitude,
        viaLongitude: hub.longitude,
        path: concatGeoJSONLineStrings(leg1.path, leg2.path),
        score: combinedScore,
        riskLevel: getRiskLevel(100 - combinedScore),
        distanceKm: Math.round(totalDist),
        extraDistanceKm: Math.round(extraDist),
        extraTimeMinutes: extraTime,
        stops: 1,
        reasoning: `Routing through ${hub.municipality || hub.name} (${hub.iataCode}) avoids ${summarizeAvoidedZones(leg1, leg2)}. Adds ${Math.round(extraDist)}km and approximately ${extraTime} minutes including connection time.`,
      });
    }
  }

  // Sort by combined metric: safety + efficiency
  candidates.sort((a, b) => {
    const aMetric = a.score * 0.6 + (1 / (a.distanceKm / directDist)) * 100 * 0.3 + (a.stops === 0 ? 10 : 0) * 0.1;
    const bMetric = b.score * 0.6 + (1 / (b.distanceKm / directDist)) * 100 * 0.3 + (b.stops === 0 ? 10 : 0) * 0.1;
    return bMetric - aMetric;
  });

  return candidates.slice(0, ALTERNATIVE_MAX_RESULTS);
}

function summarizeAvoidedZones(leg1: ReturnType<typeof scoreRoute>, leg2: ReturnType<typeof scoreRoute>): string {
  const allZones = [...leg1.nearbyZones, ...leg2.nearbyZones];
  if (allZones.length === 0) return 'the most congested airspace';

  const regions = [...new Set(allZones.map(z => z.zone.regionName.split(',')[0].trim()))];
  if (regions.length <= 2) return `conflict areas in ${regions.join(' and ')}`;
  return `conflict areas in ${regions.slice(0, 2).join(', ')} and ${regions.length - 2} other regions`;
}
