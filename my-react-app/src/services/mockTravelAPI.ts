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
  departIn:     string;
  cabin:        string;
  priceMYR:     number;
  seatsLeft:    number;
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
  'penang': 'PEN', 'pen': 'PEN', 'george town': 'PEN',
  'kota kinabalu': 'BKI', 'bki': 'BKI',
  'johor bahru': 'JHB', 'jhb': 'JHB',
  'langkawi': 'LGK', 'lgk': 'LGK',
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
  return CITY_TO_IATA[city.toLowerCase().trim()] ?? city.toUpperCase().slice(0, 3);
}

// ─── Route → airline + flight data ───────────────────────────────────────────

interface RouteData {
  airlines: Array<{ code: string; name: string }>;
  basePriceMYR: number;
}

const ROUTES: Record<string, RouteData> = {
  // KUL → Asia
  'KUL-NRT': { airlines: [{ code: 'MH', name: 'Malaysia Airlines' }, { code: 'NH', name: 'ANA' }, { code: 'D7', name: 'AirAsia X' }], basePriceMYR: 580 },
  'KUL-HND': { airlines: [{ code: 'MH', name: 'Malaysia Airlines' }, { code: 'JL', name: 'JAL' }, { code: 'D7', name: 'AirAsia X' }], basePriceMYR: 600 },
  'KUL-KIX': { airlines: [{ code: 'D7', name: 'AirAsia X' }, { code: 'MH', name: 'Malaysia Airlines' }, { code: 'JL', name: 'JAL' }], basePriceMYR: 520 },
  'KUL-SIN': { airlines: [{ code: 'MH', name: 'Malaysia Airlines' }, { code: 'AK', name: 'AirAsia' }, { code: 'SQ', name: 'Singapore Airlines' }], basePriceMYR: 180 },
  'KUL-BKK': { airlines: [{ code: 'MH', name: 'Malaysia Airlines' }, { code: 'AK', name: 'AirAsia' }, { code: 'TG', name: 'Thai Airways' }], basePriceMYR: 250 },
  'KUL-CGK': { airlines: [{ code: 'AK', name: 'AirAsia' }, { code: 'MH', name: 'Malaysia Airlines' }, { code: 'GA', name: 'Garuda Indonesia' }], basePriceMYR: 220 },
  'KUL-DPS': { airlines: [{ code: 'AK', name: 'AirAsia' }, { code: 'D7', name: 'AirAsia X' }, { code: 'MH', name: 'Malaysia Airlines' }], basePriceMYR: 350 },
  'KUL-MNL': { airlines: [{ code: 'AK', name: 'AirAsia' }, { code: 'MH', name: 'Malaysia Airlines' }, { code: 'PR', name: 'Philippine Airlines' }], basePriceMYR: 290 },
  'KUL-SGN': { airlines: [{ code: 'AK', name: 'AirAsia' }, { code: 'MH', name: 'Malaysia Airlines' }, { code: 'VN', name: 'Vietnam Airlines' }], basePriceMYR: 210 },
  'KUL-ICN': { airlines: [{ code: 'MH', name: 'Malaysia Airlines' }, { code: 'KE', name: 'Korean Air' }, { code: 'OZ', name: 'Asiana' }], basePriceMYR: 650 },
  'KUL-HKG': { airlines: [{ code: 'MH', name: 'Malaysia Airlines' }, { code: 'CX', name: 'Cathay Pacific' }, { code: 'AK', name: 'AirAsia' }], basePriceMYR: 400 },
  'KUL-PVG': { airlines: [{ code: 'MH', name: 'Malaysia Airlines' }, { code: 'MU', name: 'China Eastern' }, { code: 'AK', name: 'AirAsia' }], basePriceMYR: 480 },
  // KUL → Middle East
  'KUL-DXB': { airlines: [{ code: 'MH', name: 'Malaysia Airlines' }, { code: 'EK', name: 'Emirates' }, { code: 'FZ', name: 'flydubai' }], basePriceMYR: 1100 },
  'KUL-DOH': { airlines: [{ code: 'MH', name: 'Malaysia Airlines' }, { code: 'QR', name: 'Qatar Airways' }], basePriceMYR: 1050 },
  'KUL-IST': { airlines: [{ code: 'MH', name: 'Malaysia Airlines' }, { code: 'TK', name: 'Turkish Airlines' }], basePriceMYR: 1300 },
  // KUL → Europe
  'KUL-FRA': { airlines: [{ code: 'MH', name: 'Malaysia Airlines' }, { code: 'LH', name: 'Lufthansa' }, { code: 'EK', name: 'Emirates via DXB' }], basePriceMYR: 2100 },
  'KUL-MUC': { airlines: [{ code: 'MH', name: 'Malaysia Airlines' }, { code: 'LH', name: 'Lufthansa' }, { code: 'QR', name: 'Qatar Airways via DOH' }], basePriceMYR: 2050 },
  'KUL-BER': { airlines: [{ code: 'EK', name: 'Emirates via DXB' }, { code: 'QR', name: 'Qatar Airways via DOH' }, { code: 'TK', name: 'Turkish Airlines via IST' }], basePriceMYR: 2200 },
  'KUL-LHR': { airlines: [{ code: 'MH', name: 'Malaysia Airlines' }, { code: 'EK', name: 'Emirates via DXB' }, { code: 'QR', name: 'Qatar Airways via DOH' }], basePriceMYR: 2300 },
  'KUL-CDG': { airlines: [{ code: 'MH', name: 'Malaysia Airlines' }, { code: 'AF', name: 'Air France' }, { code: 'EK', name: 'Emirates via DXB' }], basePriceMYR: 2250 },
  'KUL-AMS': { airlines: [{ code: 'MH', name: 'Malaysia Airlines' }, { code: 'KL', name: 'KLM' }, { code: 'QR', name: 'Qatar Airways via DOH' }], basePriceMYR: 2150 },
  // KUL → Oceania
  'KUL-SYD': { airlines: [{ code: 'MH', name: 'Malaysia Airlines' }, { code: 'QF', name: 'Qantas' }, { code: 'D7', name: 'AirAsia X' }], basePriceMYR: 1400 },
  'KUL-MEL': { airlines: [{ code: 'MH', name: 'Malaysia Airlines' }, { code: 'QF', name: 'Qantas' }, { code: 'D7', name: 'AirAsia X' }], basePriceMYR: 1350 },
};

const DEFAULT_ROUTE: RouteData = {
  airlines: [{ code: 'MH', name: 'Malaysia Airlines' }, { code: 'AK', name: 'AirAsia' }, { code: 'OD', name: 'Batik Air' }],
  basePriceMYR: 500,
};

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

export async function searchFlights(
  fromRaw: string,
  toRaw:   string,
  count = 3,
): Promise<FlightOffer[]> {
  await new Promise((r) => setTimeout(r, 300));

  const from     = toIATA(fromRaw);
  const to       = toIATA(toRaw);
  const route    = ROUTES[`${from}-${to}`] ?? DEFAULT_ROUTE;
  const base     = route.basePriceMYR;
  const carriers = route.airlines.slice(0, count);

  // Deterministic but varied flight numbers per route
  const seed = from.charCodeAt(0) + to.charCodeAt(0);

  return carriers.map((al, i) => {
    const num      = (seed * 3 + i * 41 + 100) % 900 + 100;
    const hoursOut = 3 + i * 3;
    const mins     = [0, 25, 50][i] ?? 0;
    const price    = i === 2 ? Math.round(base * 3.2) : Math.round(base * (1 - i * 0.12));

    return {
      flightNumber: `${al.code}${num}`,
      airline:      al.name,
      from,
      to,
      departIn:     `+${hoursOut}h${mins > 0 ? ` ${mins}m` : ''}`,
      cabin:        i === 2 ? 'Business' : 'Economy',
      priceMYR:     price,
      seatsLeft:    [9, 4, 2][i] ?? 5,
      recommended:  i === 0,
      note:         i === 0 ? 'Earliest available — recommended' : i === 1 ? 'Good value' : 'Premium option',
    };
  });
}

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
  switch (call.tool) {
    case 'search_flights':
      return {
        tool:   'search_flights',
        result: await searchFlights(
          String(call.params.from ?? call.params.origin ?? ''),
          String(call.params.to   ?? call.params.destination ?? ''),
          Number(call.params.count ?? 3),
        ),
      };
    case 'search_hotels':
      return {
        tool:   'search_hotels',
        result: await searchHotels(String(call.params.airport ?? call.params.from ?? '')),
      };
    case 'check_compensation':
      return {
        tool:   'check_compensation',
        result: await checkCompensation(String(call.params.type ?? call.params.disruption_type ?? 'unknown')),
      };
    default:
      throw new Error(`Unknown tool: ${call.tool}`);
  }
}
