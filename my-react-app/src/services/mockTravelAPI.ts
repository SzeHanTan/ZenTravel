/**
 * Mock Travel API — simulates Amadeus-style responses.
 *
 * In production this would be replaced by real calls to:
 *   Amadeus Flight Offers Search  GET /v2/shopping/flight-offers
 *   Amadeus Hotel Offers Search   GET /v3/shopping/hotel-offers
 *   Internal compensation rules engine
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FlightOffer {
  flightNumber: string;
  airline:      string;
  from:         string;
  to:           string;
  // Brain Master fields
  departIn:     string;
  seatsLeft:    number;
  // Trip Planner fields (also present)
  timeDepart:   string;
  timeLanding:  string;
  duration:     string;
  cabin:        string;
  priceMYR:     number;
  recommended?: boolean;
  note?:        string;
}

export interface HotelOffer {
  name:      string;
  stars:     number;
  distance:  string;
  priceMYR:  number;
  amenity:   string;
  available: boolean;
  recommended?: boolean;
}

export interface CompensationResult {
  eligible:      boolean;
  amountEUR:     number;
  amountMYR:     number;
  regulation:    string;
  conditions:    string[];
  claimDeadline: string;
}

export interface ToolCallPlan {
  tool:   string;
  params: Record<string, string | number | boolean>;
}

export type ToolResult =
  | { tool: 'search_flights';     result: FlightOffer[] }
  | { tool: 'search_hotels';      result: HotelOffer[] }
  | { tool: 'check_compensation'; result: CompensationResult };

// ─── IATA normaliser ──────────────────────────────────────────────────────────

const CITY_TO_IATA: Record<string, string> = {
  // Malaysia
  'kuala lumpur': 'KUL', 'kl': 'KUL', 'klia': 'KUL', 'kul': 'KUL',
  'mly': 'KUL', 'malaysia': 'KUL', 'msia': 'KUL',
  'penang': 'PEN', 'pen': 'PEN',
  // Japan
  'tokyo': 'NRT', 'narita': 'NRT', 'nrt': 'NRT',
  'haneda': 'HND', 'hnd': 'HND',
  'osaka': 'KIX', 'kix': 'KIX',
  'sapporo': 'CTS', 'cts': 'CTS',
  // Southeast Asia
  'singapore': 'SIN', 'sin': 'SIN',
  'bangkok': 'BKK', 'bkk': 'BKK', 'suvarnabhumi': 'BKK',
  'jakarta': 'CGK', 'cgk': 'CGK',
  'bali': 'DPS', 'denpasar': 'DPS', 'dps': 'DPS',
  'manila': 'MNL', 'mnl': 'MNL',
  'ho chi minh': 'SGN', 'sgn': 'SGN', 'saigon': 'SGN',
  'hanoi': 'HAN', 'han': 'HAN',
  'phnom penh': 'PNH', 'pnh': 'PNH',
  // South Korea & China
  'seoul': 'ICN', 'incheon': 'ICN', 'icn': 'ICN',
  'beijing': 'PEK', 'pek': 'PEK',
  'shanghai': 'PVG', 'pvg': 'PVG',
  'hong kong': 'HKG', 'hkg': 'HKG',
  // Middle East
  'dubai': 'DXB', 'dxb': 'DXB',
  'abu dhabi': 'AUH', 'auh': 'AUH',
  'doha': 'DOH', 'doh': 'DOH',
  'riyadh': 'RUH', 'ruh': 'RUH',
  // Europe — Germany
  'germany': 'FRA', 'frankfurt': 'FRA', 'fra': 'FRA',
  'munich': 'MUC', 'münchen': 'MUC', 'muc': 'MUC',
  'berlin': 'BER', 'ber': 'BER',
  'hamburg': 'HAM', 'ham': 'HAM',
  'dusseldorf': 'DUS', 'düsseldorf': 'DUS', 'dus': 'DUS',
  // Europe — UK & others
  'london': 'LHR', 'heathrow': 'LHR', 'lhr': 'LHR',
  'gatwick': 'LGW', 'lgw': 'LGW',
  'paris': 'CDG', 'cdg': 'CDG',
  'amsterdam': 'AMS', 'ams': 'AMS',
  'zurich': 'ZRH', 'zürich': 'ZRH', 'zrh': 'ZRH',
  'rome': 'FCO', 'fco': 'FCO',
  'madrid': 'MAD', 'mad': 'MAD',
  'istanbul': 'IST', 'ist': 'IST',
  // Oceania
  'sydney': 'SYD', 'syd': 'SYD',
  'melbourne': 'MEL', 'mel': 'MEL',
  'perth': 'PER', 'per': 'PER',
  // Americas
  'new york': 'JFK', 'jfk': 'JFK',
  'los angeles': 'LAX', 'lax': 'LAX',
};

export function toIATA(city: string): string {
  const normalized = city.toLowerCase().trim();
  // Check the dictionary first, then fallback to first 3 letters
  return CITY_TO_IATA[normalized] ?? city.toUpperCase().slice(0, 3);
}

// ─── Route → airline + flight data ───────────────────────────────────────────

// --- Updated Types ---
export interface RouteData {
  airlines: Array<{ code: string; name: string }>;
  basePriceMYR: number;
  durationMins: number; // Duration in minutes for calculation
}

const ROUTES: Record<string, RouteData> = {
  // --- MALAYSIA DOMESTIC ---
  'KUL-PEN': { airlines: [{ code: 'AK', name: 'AirAsia' }, { code: 'MH', name: 'Malaysia Airlines' }], basePriceMYR: 120, durationMins: 60 },
  'KUL-LGK': { airlines: [{ code: 'AK', name: 'AirAsia' }, { code: 'OD', name: 'Batik Air' }], basePriceMYR: 150, durationMins: 65 },
  'KUL-BKI': { airlines: [{ code: 'MH', name: 'Malaysia Airlines' }, { code: 'AK', name: 'AirAsia' }], basePriceMYR: 350, durationMins: 165 },
  'KUL-KCH': { airlines: [{ code: 'AK', name: 'AirAsia' }, { code: 'MH', name: 'Malaysia Airlines' }], basePriceMYR: 300, durationMins: 105 },

  // --- SOUTH & NORTH ASIA ---
  'KUL-SIN': { airlines: [{ code: 'MH', name: 'Malaysia Airlines' }, { code: 'AK', name: 'AirAsia' }, { code: 'SQ', name: 'Singapore Airlines' }], basePriceMYR: 180, durationMins: 65 },
  'KUL-BKK': { airlines: [{ code: 'MH', name: 'Malaysia Airlines' }, { code: 'TG', name: 'Thai Airways' }], basePriceMYR: 250, durationMins: 130 },
  'KUL-TPE': { airlines: [{ code: 'CI', name: 'China Airlines' }, { code: 'BR', name: 'EVA Air' }, { code: 'D7', name: 'AirAsia X' }], basePriceMYR: 650, durationMins: 285 },
  'KUL-HKG': { airlines: [{ code: 'CX', name: 'Cathay Pacific' }, { code: 'MH', name: 'Malaysia Airlines' }], basePriceMYR: 550, durationMins: 240 },
  'KUL-ICN': { airlines: [{ code: 'KE', name: 'Korean Air' }, { code: 'MH', name: 'Malaysia Airlines' }, { code: 'D7', name: 'AirAsia X' }], basePriceMYR: 680, durationMins: 395 },
  'KUL-NRT': { airlines: [{ code: 'MH', name: 'Malaysia Airlines' }, { code: 'NH', name: 'ANA' }, { code: 'JL', name: 'JAL' }], basePriceMYR: 850, durationMins: 435 },
  'KUL-PVG': { airlines: [{ code: 'MU', name: 'China Eastern' }, { code: 'MH', name: 'Malaysia Airlines' }], basePriceMYR: 700, durationMins: 320 },

  // --- MIDDLE EAST ---
  'KUL-DXB': { airlines: [{ code: 'EK', name: 'Emirates' }, { code: 'MH', name: 'Malaysia Airlines' }], basePriceMYR: 1800, durationMins: 430 },
  'KUL-DOH': { airlines: [{ code: 'QR', name: 'Qatar Airways' }, { code: 'MH', name: 'Malaysia Airlines' }], basePriceMYR: 1750, durationMins: 450 },
  'KUL-IST': { airlines: [{ code: 'TK', name: 'Turkish Airlines' }], basePriceMYR: 2100, durationMins: 680 },

  // --- EUROPE ---
  'KUL-LHR': { airlines: [{ code: 'MH', name: 'Malaysia Airlines' }, { code: 'BA', name: 'British Airways' }], basePriceMYR: 2800, durationMins: 830 },
  'KUL-CDG': { airlines: [{ code: 'AF', name: 'Air France' }, { code: 'EK', name: 'Emirates (Via DXB)' }], basePriceMYR: 2600, durationMins: 810 },
  'KUL-FRA': { airlines: [{ code: 'LH', name: 'Lufthansa' }, { code: 'QR', name: 'Qatar (Via DOH)' }], basePriceMYR: 2550, durationMins: 790 },
  'KUL-AMS': { airlines: [{ code: 'KL', name: 'KLM' }, { code: 'MH', name: 'Malaysia Airlines' }], basePriceMYR: 2700, durationMins: 820 },

  // --- OCEANIA ---
  'KUL-SYD': { airlines: [{ code: 'QF', name: 'Qantas' }, { code: 'MH', name: 'Malaysia Airlines' }, { code: 'D7', name: 'AirAsia X' }], basePriceMYR: 1400, durationMins: 505 },
  'KUL-MEL': { airlines: [{ code: 'MH', name: 'Malaysia Airlines' }, { code: 'QF', name: 'Qantas' }], basePriceMYR: 1350, durationMins: 495 },
  'KUL-PER': { airlines: [{ code: 'AK', name: 'AirAsia' }, { code: 'MH', name: 'Malaysia Airlines' }], basePriceMYR: 800, durationMins: 340 },
  'KUL-AKL': { airlines: [{ code: 'NZ', name: 'Air New Zealand' }, { code: 'MH', name: 'Malaysia Airlines' }], basePriceMYR: 2200, durationMins: 630 },

  // --- NORTH AMERICA (Direct or Via Hub) ---
  'KUL-JFK': { airlines: [{ code: 'QR', name: 'Qatar Airways' }, { code: 'SQ', name: 'Singapore Airlines' }], basePriceMYR: 3500, durationMins: 1260 }, // ~21 hours total
  'KUL-LAX': { airlines: [{ code: 'CX', name: 'Cathay Pacific' }, { code: 'JL', name: 'JAL' }], basePriceMYR: 3200, durationMins: 1140 }, // ~19 hours total
  'KUL-YVR': { airlines: [{ code: 'AC', name: 'Air Canada' }], basePriceMYR: 3300, durationMins: 1080 },
};

const DEFAULT_ROUTE: RouteData = {
  airlines: [{ code: 'MH', name: 'Malaysia Airlines' }, { code: 'AK', name: 'AirAsia' }],
  basePriceMYR: 500,
  durationMins: 240,
};

// --- Helper: Calculate Arrival Time ---
const calculateArrival = (departTime: string, durationMins: number) => {
  const [h, m] = departTime.split(':').map(Number);
  let totalMins = h * 60 + m + durationMins;
  const arrivalH = Math.floor(totalMins / 60) % 24;
  const arrivalM = totalMins % 60;
  const nextDay = totalMins >= 1440 ? ' (+1)' : '';
  return `${String(arrivalH).padStart(2, '0')}:${String(arrivalM).padStart(2, '0')}${nextDay}`;
};

// --- Updated Search Function ---
export async function searchFlights(
  fromRaw:       string,
  toRaw:         string,
  countOrClass:  string | number = 3,
): Promise<FlightOffer[]> {
  await new Promise((r) => setTimeout(r, 400));

  const from = toIATA(fromRaw);
  const to   = toIATA(toRaw);
  const routeKey = `${from}-${to}`;
  const route    = ROUTES[routeKey] ?? DEFAULT_ROUTE;

  // Accept either a class string or a count number (Brain Master passes count)
  const cabin = typeof countOrClass === 'string' ? countOrClass : 'Economy';
  const count = typeof countOrClass === 'number'  ? countOrClass : 3;

  const startTimes  = ['07:30', '11:15', '15:45', '22:10'];
  const durationStr = `${Math.floor(route.durationMins / 60)}h ${route.durationMins % 60}m`;
  const seats       = [9, 4, 2, 6];

  return route.airlines.slice(0, Math.max(count, 1)).map((al, i) => {
    const depart   = startTimes[i] ?? '09:00';
    const departIn = `+${Math.round((i + 1) * 2.5)}h`;
    return {
      airline:      al.name,
      flightNumber: `${al.code}${100 + i * 23}`,
      from,
      to,
      departIn,
      seatsLeft:   seats[i] ?? 5,
      timeDepart:  depart,
      timeLanding: calculateArrival(depart, route.durationMins),
      duration:    durationStr,
      cabin,
      priceMYR:    Math.round(route.basePriceMYR * (1 + i * 0.15)),
      recommended: i === 0,
      note:        i === 0 ? 'Earliest available — recommended' : i === 1 ? 'Good value' : 'Premium option',
    } satisfies FlightOffer;
  });
}

// ─── Airport hotel database ───────────────────────────────────────────────────

const AIRPORT_HOTELS: Record<string, HotelOffer[]> = {
  KUL: [
    { name: 'Sama-Sama Hotel KLIA',       stars: 4, distance: 'Connected to terminal', priceMYR: 420, amenity: 'Free airport shuttle & 24h F&B', available: true, recommended: true },
    { name: 'Tune Hotel KLIA2',           stars: 3, distance: '5-min walk',            priceMYR: 185, amenity: 'Budget-friendly, complimentary WiFi', available: true },
    { name: 'Mövenpick Hotel KLIA',       stars: 5, distance: '10-min free shuttle',   priceMYR: 660, amenity: 'Rooftop pool, spa, late checkout', available: true },
  ],
  SIN: [
    { name: 'Crowne Plaza Changi Airport', stars: 5, distance: 'Connected to T3',      priceMYR: 820, amenity: 'Infinity pool, free transit hotel', available: true, recommended: true },
    { name: 'YOTELAIR Singapore Changi',  stars: 4, distance: 'Inside T1',             priceMYR: 480, amenity: 'In-terminal, ideal for layovers', available: true },
    { name: 'Aerotel Transit Hotel',      stars: 3, distance: 'Inside T1/T2/T3',       priceMYR: 290, amenity: 'Hourly rates available', available: true },
  ],
  NRT: [
    { name: 'Hilton Tokyo Narita Airport', stars: 4, distance: '5-min free shuttle',   priceMYR: 610, amenity: 'Free shuttle every 20 min', available: true, recommended: true },
    { name: 'APA Hotel Narita',           stars: 3, distance: '10-min bus',            priceMYR: 310, amenity: 'Japanese breakfast included', available: true },
    { name: 'Mercure Tokyo Narita',       stars: 4, distance: '8-min shuttle',         priceMYR: 450, amenity: 'Restaurant & bar on-site', available: true },
  ],
  HND: [
    { name: 'Haneda Excel Hotel Tokyu',   stars: 4, distance: 'Connected to T1/T2',    priceMYR: 580, amenity: 'In-terminal, open 24h', available: true, recommended: true },
    { name: 'Keikyu EX Inn Haneda',       stars: 3, distance: '5-min walk',            priceMYR: 280, amenity: 'Compact, central location', available: true },
    { name: 'Sheraton Haneda Hotel',      stars: 4, distance: '5-min free shuttle',    priceMYR: 620, amenity: 'Pool, gym, lounge access', available: true },
  ],
  FRA: [
    { name: 'Sheraton Frankfurt Airport', stars: 5, distance: 'Connected to T1',       priceMYR: 980, amenity: 'Direct terminal access, 24h restaurant', available: true, recommended: true },
    { name: 'Hilton Frankfurt Airport',   stars: 4, distance: '5-min walkway',         priceMYR: 760, amenity: 'Skyline views, pool & spa', available: true },
    { name: 'Ibis Frankfurt Airport',     stars: 3, distance: '10-min free shuttle',   priceMYR: 380, amenity: 'Budget option, 24h bar', available: true },
  ],
  MUC: [
    { name: 'Munich Airport Marriott',    stars: 5, distance: 'Connected via walkway', priceMYR: 920, amenity: 'Pool, business centre', available: true, recommended: true },
    { name: 'Hilton Munich Airport',      stars: 4, distance: '5-min sky bridge',      priceMYR: 780, amenity: 'Rooftop terrace, restaurant', available: true },
    { name: 'Novotel Munich Airport',     stars: 4, distance: '10-min shuttle',        priceMYR: 560, amenity: 'Free shuttle, outdoor pool', available: true },
  ],
  BER: [
    { name: 'Steigenberger Hotel Berlin Airport', stars: 4, distance: 'Connected to T1', priceMYR: 820, amenity: '24h room service, spa', available: true, recommended: true },
    { name: 'Ibis Berlin Airport',        stars: 3, distance: '5-min walk',            priceMYR: 360, amenity: 'Budget, 24h check-in', available: true },
    { name: 'Hampton by Hilton Berlin',   stars: 3, distance: '10-min free shuttle',   priceMYR: 450, amenity: 'Free hot breakfast', available: true },
  ],
  LHR: [
    { name: 'Sofitel London Heathrow',    stars: 5, distance: 'Connected to T5',       priceMYR: 1100, amenity: 'Luxury spa & fine dining', available: true, recommended: true },
    { name: 'Hilton London Heathrow T4',  stars: 4, distance: 'Connected to T4',       priceMYR: 780,  amenity: 'Free shuttle to all terminals', available: true },
    { name: 'Ibis London Heathrow',       stars: 3, distance: '5-min shuttle',         priceMYR: 390,  amenity: 'Budget option, 24h bar', available: true },
  ],
  SYD: [
    { name: 'Rydges Sydney Airport',      stars: 4, distance: 'Connected to T1',       priceMYR: 680, amenity: 'Free in-terminal transit', available: true, recommended: true },
    { name: 'Mantra Sydney Airport',      stars: 4, distance: '5-min walk',            priceMYR: 520, amenity: 'Pool & gym', available: true },
    { name: 'Ibis Sydney Airport',        stars: 3, distance: '10-min free shuttle',   priceMYR: 340, amenity: 'Budget, 24h dining', available: true },
  ],
  DXB: [
    { name: 'Dubai International Hotel',       stars: 5, distance: 'Inside T1 & T3',       priceMYR: 1200, amenity: 'Exclusive transit access, pool', available: true, recommended: true },
    { name: 'Pullman Dubai Airport',           stars: 4, distance: '10-min free shuttle',  priceMYR: 750,  amenity: 'Pool, spa, restaurant', available: true },
    { name: 'Premier Inn Dubai Airport',       stars: 3, distance: '15-min bus',           priceMYR: 400,  amenity: 'Reliable budget option', available: true },
  ],

  // Southeast Asia
  BKK: [
    { name: 'Novotel Suvarnabhumi Airport',    stars: 4, distance: 'Connected to terminal', priceMYR: 520, amenity: 'Direct terminal walkway, pool', available: true, recommended: true },
    { name: 'Ibis Styles Bangkok Airport',     stars: 3, distance: '5-min free shuttle',   priceMYR: 260, amenity: 'Budget, 24h reception', available: true },
    { name: 'Miracle Transit Hotel BKK',       stars: 3, distance: 'Inside terminal',      priceMYR: 195, amenity: 'Hourly rates, transit convenience', available: true },
  ],
  CGK: [
    { name: 'Sheraton Bandara Jakarta',        stars: 5, distance: 'Connected to T3',      priceMYR: 680, amenity: 'Infinity pool, 5-star dining', available: true, recommended: true },
    { name: 'Ibis Jakarta Airport',            stars: 3, distance: '5-min shuttle',        priceMYR: 290, amenity: 'Budget, free shuttle', available: true },
    { name: 'Aston Jakarta Airport Hotel',     stars: 4, distance: '10-min shuttle',       priceMYR: 440, amenity: 'Pool, gym, complimentary breakfast', available: true },
  ],
  DPS: [
    { name: 'Swiss-Belhotel Rainforest Bali',  stars: 4, distance: '10-min from airport',  priceMYR: 390, amenity: 'Tropical pool, spa', available: true, recommended: true },
    { name: 'Pop! Hotel Airport Bali',         stars: 3, distance: '5-min walk',           priceMYR: 190, amenity: 'Budget, free airport transfer', available: true },
    { name: 'Grand Mega Resort Bali Airport',  stars: 4, distance: '3-min drive',          priceMYR: 420, amenity: 'Pool, Balinese spa, breakfast incl.', available: true },
  ],
  MNL: [
    { name: 'Marriott Manila Airport',         stars: 5, distance: 'Connected to T3',      priceMYR: 750, amenity: 'Pool, fine dining, lounge access', available: true, recommended: true },
    { name: 'Microtel by Wyndham Manila',      stars: 3, distance: '5-min shuttle',        priceMYR: 220, amenity: 'Budget, 24h restaurant', available: true },
    { name: 'Belmont Hotel Manila',            stars: 4, distance: 'Adjacent to T3',       priceMYR: 490, amenity: 'Sky garden, free shuttle', available: true },
  ],
  ICN: [
    { name: 'Grand Hyatt Incheon',             stars: 5, distance: 'Connected to T1',      priceMYR: 1050, amenity: 'Luxury spa, indoor pool, fine dining', available: true, recommended: true },
    { name: 'Ibis Ambassador Incheon Airport', stars: 3, distance: '5-min shuttle',        priceMYR:  370, amenity: 'Budget, free shuttle', available: true },
    { name: 'Paradise City Incheon',           stars: 5, distance: '10-min from T1',       priceMYR: 1200, amenity: 'Integrated resort, casino, spa', available: true },
  ],
  HKG: [
    { name: 'Regal Airport Hotel Hong Kong',   stars: 5, distance: 'Connected to terminal', priceMYR: 980, amenity: 'Direct terminal link, pool & spa', available: true, recommended: true },
    { name: 'SkyCity Marriott Hong Kong',      stars: 5, distance: '5-min walkway',         priceMYR: 920, amenity: 'Golf course view, multiple restaurants', available: true },
    { name: 'iclub Nam Fung Praya Hotel',      stars: 3, distance: '15-min shuttle',        priceMYR: 400, amenity: 'Budget city-style, free shuttle', available: true },
  ],

  // Middle East
  DOH: [
    { name: 'Oryx Airport Hotel Doha',         stars: 5, distance: 'Inside Hamad Airport',  priceMYR: 1100, amenity: 'Transit hotel, pool, 24h lounge', available: true, recommended: true },
    { name: 'Marriott Marquis City Center Doha', stars: 5, distance: '20-min shuttle',      priceMYR: 1350, amenity: 'Rooftop pool, luxury dining', available: true },
    { name: 'Ibis Doha Airport',               stars: 3, distance: '10-min shuttle',        priceMYR:  420, amenity: 'Budget, free shuttle', available: true },
  ],
  IST: [
    { name: 'Turkish Airlines Travel Hotel',   stars: 4, distance: 'Inside new airport',    priceMYR: 720, amenity: 'Complimentary for long layovers (TK)', available: true, recommended: true },
    { name: 'Novotel Istanbul Airport',        stars: 4, distance: 'Connected via walkway', priceMYR: 680, amenity: 'Pool, restaurant, business centre', available: true },
    { name: 'Ibis Istanbul Airport',           stars: 3, distance: '5-min walkway',         priceMYR: 310, amenity: 'Budget, 24h dining', available: true },
  ],

  // Europe
  CDG: [
    { name: 'Sheraton Paris Airport CDG',      stars: 4, distance: 'Connected to T2',       priceMYR: 890, amenity: 'Direct terminal access, restaurant', available: true, recommended: true },
    { name: 'Hilton Paris CDG Airport',        stars: 4, distance: '10-min free shuttle',   priceMYR: 780, amenity: 'Pool, gym, bar', available: true },
    { name: 'Ibis Paris CDG Airport',          stars: 3, distance: '5-min shuttle',         priceMYR: 380, amenity: 'Budget, 24h reception', available: true },
  ],
  AMS: [
    { name: 'Sheraton Amsterdam Airport',      stars: 4, distance: 'Connected to Schiphol', priceMYR: 950, amenity: 'Direct train & terminal link', available: true, recommended: true },
    { name: 'Hilton Amsterdam Airport',        stars: 4, distance: '5-min walkway',         priceMYR: 870, amenity: 'Pool, wellness centre', available: true },
    { name: 'Ibis Amsterdam Airport',          stars: 3, distance: '10-min shuttle',        priceMYR: 420, amenity: 'Budget, free shuttle', available: true },
  ],

  // Oceania
  MEL: [
    { name: 'Melbourne Airport Pullman',       stars: 5, distance: 'Connected to T2/T3',    priceMYR: 780, amenity: 'Pool, spa, airport walkway', available: true, recommended: true },
    { name: 'Park Royal Melbourne Airport',    stars: 4, distance: 'Connected to T1',       priceMYR: 620, amenity: 'Restaurant, free shuttle', available: true },
    { name: 'Ibis Melbourne Airport',          stars: 3, distance: '5-min shuttle',         priceMYR: 340, amenity: 'Budget, 24h bar', available: true },
  ],
};

const DEFAULT_HOTELS: HotelOffer[] = [
  { name: 'Airport Transit Hotel',   stars: 3, distance: 'At terminal',     priceMYR: 280, amenity: 'Hourly & nightly rates', available: true, recommended: true },
  { name: 'Ibis Airport Hotel',      stars: 3, distance: '5-min shuttle',   priceMYR: 320, amenity: 'Restaurant & bar on-site', available: true },
  { name: 'Novotel Airport Hotel',   stars: 4, distance: '10-min free bus', priceMYR: 490, amenity: 'Pool, gym, free cancellation', available: true },
];

// ─── Compensation rules ────────────────────────────────────────────────────────

const COMPENSATION: Record<string, CompensationResult> = {
  cancellation: {
    eligible:      true,
    amountEUR:     600,
    amountMYR:     3000,
    regulation:    'EU Regulation 261/2004 / Malaysia Aviation Consumer Protection Code 2016',
    conditions:    [
      'Cancellation notified less than 14 days before departure',
      'Not caused by extraordinary circumstances (weather, ATC strikes)',
      'Carrier must offer rerouting or full refund',
    ],
    claimDeadline: '6 years (Malaysia) / 3 years (EU)',
  },
  delay: {
    eligible:      true,
    amountEUR:     250,
    amountMYR:     1300,
    regulation:    'EU Regulation 261/2004 / Malaysia Aviation Consumer Protection Code 2016',
    conditions:    [
      'Delay of 3+ hours at final destination',
      'Not caused by extraordinary circumstances',
      'Carrier must provide meals, refreshments, accommodation if overnight',
    ],
    claimDeadline: '6 years (Malaysia) / 3 years (EU)',
  },
  lost_luggage: {
    eligible:      true,
    amountEUR:     1300,
    amountMYR:     6500,
    regulation:    'Montreal Convention 1999 — Article 22',
    conditions:    [
      'File Property Irregularity Report (PIR) at airport before leaving baggage claim',
      'Submit formal claim within 21 days for delayed, 7 days for damaged baggage',
      'Keep all receipts for essential purchases during delay',
    ],
    claimDeadline: '2 years from arrival date',
  },
};

// ─── Public API functions ──────────────────────────────────────────────────────

export async function searchHotels(airportRaw: string): Promise<HotelOffer[]> {
  await new Promise((r) => setTimeout(r, 200));
  const code = toIATA(airportRaw);
  return AIRPORT_HOTELS[code] ?? DEFAULT_HOTELS;
}

export async function checkCompensation(disruptionType: string): Promise<CompensationResult> {
  await new Promise((r) => setTimeout(r, 100));
  return (
    COMPENSATION[disruptionType] ?? {
      eligible:      false,
      amountEUR:     0,
      amountMYR:     0,
      regulation:    'N/A',
      conditions:    ['Disruption type not covered by standard compensation rules.'],
      claimDeadline: 'N/A',
    }
  );
}

export async function executeTool(call: ToolCallPlan): Promise<ToolResult> {
  // Use optional chaining throughout — GLM may omit `params` on a malformed response
  const p = call.params ?? {};
  switch (call.tool) {
    case 'search_flights':
      return {
        tool:   'search_flights',
        result: await searchFlights(
          String(p.from ?? p.origin ?? ''),
          String(p.to   ?? p.destination ?? ''),
          Number(p.count ?? 3),
        ),
      };
    case 'search_hotels':
      return {
        tool:   'search_hotels',
        result: await searchHotels(String(p.airport ?? p.from ?? p.origin ?? '')),
      };
    case 'check_compensation':
      return {
        tool:   'check_compensation',
        result: await checkCompensation(String(p.type ?? p.disruption_type ?? 'unknown')),
      };
    default:
      // Return a no-op compensation result for any unknown tool name
      return {
        tool:   'check_compensation' as const,
        result: await checkCompensation('unknown'),
      };
  }
}
