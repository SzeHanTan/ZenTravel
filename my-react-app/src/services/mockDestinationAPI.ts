/**
 * Mock Destination API — provides rich travel data for trip planning.
 * Covers attractions, must-try foods, tips, and budget info per city.
 */

export interface Attraction {
  name: string;
  type: 'landmark' | 'museum' | 'nature' | 'entertainment' | 'shopping' | 'religious';
  description: string;
  duration: string;
  bestTime: 'Morning' | 'Afternoon' | 'Evening' | 'Any';
  entryFee?: string;
  neighborhood: string;
}

export interface MustTryFood {
  name: string;
  description: string;
  where: string;
  priceMYR: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'any';
}

export interface DestinationInfo {
  city: string;
  country: string;
  currency: string;
  timezone: string;
  bestSeason: string;
  emoji: string;
  attractions: Attraction[];
  foods: MustTryFood[];
  tips: string[];
  neighborhoods: string[];
  avgDailyBudgetMYR: { budget: number; comfort: number; luxury: number };
}

// ─── Destination Database ────────────────────────────────────────────────────

const DESTINATIONS: Record<string, DestinationInfo> = {
  london: {
    city: 'London', country: 'United Kingdom', currency: 'GBP (£)',
    timezone: 'GMT / BST (UTC+0 / UTC+1)',
    bestSeason: 'June – August (warm & long days)',
    emoji: '🇬🇧',
    neighborhoods: ['Westminster', 'Soho', 'Shoreditch', 'Notting Hill', 'Camden'],
    attractions: [
      { name: 'Tower of London', type: 'landmark', description: 'Iconic medieval fortress housing the Crown Jewels and over 900 years of royal history.', duration: '2–3 hours', bestTime: 'Morning', entryFee: '£30 (~MYR 190)', neighborhood: 'Tower Hill' },
      { name: 'British Museum', type: 'museum', description: 'World-class museum with 8 million artefacts including the Rosetta Stone and Elgin Marbles.', duration: '3–4 hours', bestTime: 'Morning', entryFee: 'Free', neighborhood: 'Bloomsbury' },
      { name: 'Buckingham Palace', type: 'landmark', description: 'The official residence of the British monarch — catch the Changing of the Guard at 11 am.', duration: '1–2 hours', bestTime: 'Morning', entryFee: 'Free (exterior)', neighborhood: 'Westminster' },
      { name: 'Hyde Park', type: 'nature', description: 'London\'s most famous royal park — rowboats on the Serpentine lake, Speakers\' Corner, and lush gardens.', duration: '1–3 hours', bestTime: 'Afternoon', entryFee: 'Free', neighborhood: 'Kensington' },
      { name: 'Borough Market', type: 'shopping', description: 'London\'s oldest and most celebrated food market. A foodie paradise with artisan bread, cheese, and street food.', duration: '1–2 hours', bestTime: 'Morning', neighborhood: 'Southwark' },
      { name: 'Tate Modern', type: 'museum', description: 'World\'s most-visited modern art gallery in a converted Bankside power station.', duration: '2–3 hours', bestTime: 'Afternoon', entryFee: 'Free (special exhibits paid)', neighborhood: 'Southbank' },
      { name: 'Covent Garden', type: 'entertainment', description: 'Vibrant piazza with street performers, theatres, boutiques, and excellent dining.', duration: '2–3 hours', bestTime: 'Evening', neighborhood: 'West End' },
      { name: 'Tower Bridge', type: 'landmark', description: 'London\'s most iconic Victorian Gothic bridge; visit the glass floor walkway for stunning views.', duration: '1 hour', bestTime: 'Evening', entryFee: '£11 (~MYR 70)', neighborhood: 'Southwark' },
    ],
    foods: [
      { name: 'Fish & Chips', description: 'Britain\'s ultimate comfort food — crispy battered cod with chunky fried potatoes.', where: 'The Golden Hind, Marylebone', priceMYR: 'MYR 55–80', mealType: 'lunch' },
      { name: 'Full English Breakfast', description: 'Bacon, eggs, sausage, baked beans, grilled tomatoes, mushrooms and toast.', where: 'Café Diana, Notting Hill', priceMYR: 'MYR 50–75', mealType: 'breakfast' },
      { name: 'Chicken Tikka Masala', description: 'Britain\'s adopted national dish — creamy, spiced tomato curry that\'s a must-try.', where: 'Dishoom, Covent Garden', priceMYR: 'MYR 65–100', mealType: 'dinner' },
      { name: 'Afternoon Tea', description: 'Finger sandwiches, scones with clotted cream, and pastries with fine teas.', where: 'The Ritz London', priceMYR: 'MYR 250–400', mealType: 'snack' },
      { name: 'Scotch Egg', description: 'Hard-boiled egg wrapped in seasoned sausage meat and breadcrumbed — a perfect pub snack.', where: 'Borough Market stalls', priceMYR: 'MYR 20–35', mealType: 'snack' },
    ],
    tips: [
      'Get an Oyster card or contactless bank card for all tube & bus travel.',
      'Book popular attractions (Tower of London, Kew Gardens) weeks in advance.',
      'Pubs stop serving at 11 pm — plan evening drinks early.',
      'Walk the South Bank from Tower Bridge to Tate Modern for free sightseeing.',
      'Sunday markets (Portobello Road, Columbia Road) are worth an early start.',
    ],
    avgDailyBudgetMYR: { budget: 250, comfort: 550, luxury: 1200 },
  },

  paris: {
    city: 'Paris', country: 'France', currency: 'EUR (€)',
    timezone: 'CET/CEST (UTC+1 / UTC+2)',
    bestSeason: 'April–June or September–October',
    emoji: '🇫🇷',
    neighborhoods: ['Le Marais', 'Montmartre', 'Saint-Germain', 'Bastille', 'Champs-Élysées'],
    attractions: [
      { name: 'Eiffel Tower', type: 'landmark', description: 'Paris\'s iron lady — take the lift to the summit for panoramic city views. Dazzling light shows at night.', duration: '2–3 hours', bestTime: 'Evening', entryFee: '€29 (~MYR 150)', neighborhood: 'Trocadéro' },
      { name: 'The Louvre', type: 'museum', description: 'World\'s largest art museum — home to the Mona Lisa, Venus de Milo, and 35,000+ works.', duration: '3–5 hours', bestTime: 'Morning', entryFee: '€22 (~MYR 115)', neighborhood: '1st Arrondissement' },
      { name: 'Musée d\'Orsay', type: 'museum', description: 'Impressionist masterworks by Monet, Renoir, and Van Gogh in a stunning Beaux-Arts railway station.', duration: '2–3 hours', bestTime: 'Afternoon', entryFee: '€16 (~MYR 85)', neighborhood: '7th Arrondissement' },
      { name: 'Notre-Dame Cathedral', type: 'religious', description: 'Iconic Gothic cathedral on Île de la Cité, recently restored after the 2019 fire.', duration: '1–2 hours', bestTime: 'Morning', entryFee: 'Free (planned)', neighborhood: 'Île de la Cité' },
      { name: 'Sacré-Cœur Basilica', type: 'religious', description: 'Gleaming white basilica crowning Montmartre hill — free entry and the best views of Paris below.', duration: '1–2 hours', bestTime: 'Morning', entryFee: 'Free', neighborhood: 'Montmartre' },
      { name: 'Palace of Versailles', type: 'landmark', description: 'Louis XIV\'s opulent royal palace with the Hall of Mirrors and extraordinary formal gardens.', duration: 'Full day', bestTime: 'Morning', entryFee: '€21 (~MYR 110)', neighborhood: 'Versailles (day trip)' },
      { name: 'Le Marais', type: 'shopping', description: 'Trendy historic district with art galleries, vintage shops, Jewish quarter, and the Place des Vosges.', duration: '2–4 hours', bestTime: 'Afternoon', neighborhood: 'Marais' },
    ],
    foods: [
      { name: 'Croissant', description: 'Buttery, flaky pastry best enjoyed fresh from a boulangerie in the morning.', where: 'Stohrer, 2nd Arrondissement', priceMYR: 'MYR 5–12', mealType: 'breakfast' },
      { name: 'Crêpes', description: 'Thin pancakes with sweet (Nutella, jam) or savoury (ham & cheese) fillings.', where: 'Street stalls near Sacré-Cœur', priceMYR: 'MYR 15–30', mealType: 'snack' },
      { name: 'Steak Frites', description: 'Classic French bistro staple — pan-seared entrecôte with crispy golden fries and sauce béarnaise.', where: 'Café de Flore, Saint-Germain', priceMYR: 'MYR 100–180', mealType: 'dinner' },
      { name: 'Soupe à l\'oignon', description: 'Deeply caramelised French onion soup topped with gruyère crouton — perfect in cooler months.', where: 'Au Pied de Cochon, 1st Arr.', priceMYR: 'MYR 65–100', mealType: 'lunch' },
      { name: 'Macarons', description: 'Colourful, delicate almond meringue sandwich cookies in every imaginable flavour.', where: 'Ladurée, Champs-Élysées', priceMYR: 'MYR 15–25 each', mealType: 'snack' },
    ],
    tips: [
      'Buy a Paris Museum Pass (2, 4 or 6 days) for skip-the-line access to 50+ museums.',
      'Validate your metro ticket every journey — inspectors are frequent.',
      'Most museums are free or reduced on the first Sunday of each month.',
      'Say "Bonjour" first before asking anything in shops or cafes — it goes a long way.',
      'Versailles is very crowded; book the first morning slot online.',
    ],
    avgDailyBudgetMYR: { budget: 280, comfort: 600, luxury: 1400 },
  },

  tokyo: {
    city: 'Tokyo', country: 'Japan', currency: 'JPY (¥)',
    timezone: 'JST (UTC+9)',
    bestSeason: 'March–May (cherry blossom) or Oct–Nov (autumn foliage)',
    emoji: '🇯🇵',
    neighborhoods: ['Shinjuku', 'Shibuya', 'Asakusa', 'Harajuku', 'Akihabara', 'Ginza'],
    attractions: [
      { name: 'Senso-ji Temple', type: 'religious', description: 'Tokyo\'s oldest and most significant temple in Asakusa — spectacular Kaminarimon gate and Nakamise shopping street.', duration: '1–2 hours', bestTime: 'Morning', entryFee: 'Free', neighborhood: 'Asakusa' },
      { name: 'Shibuya Crossing', type: 'landmark', description: 'World\'s busiest pedestrian scramble intersection — best viewed from Starbucks or MAGNET by Shibuya 109.', duration: '30 min', bestTime: 'Evening', entryFee: 'Free', neighborhood: 'Shibuya' },
      { name: 'teamLab Planets', type: 'entertainment', description: 'Immersive digital art museum where you walk through dazzling light installations.', duration: '1.5–2 hours', bestTime: 'Any', entryFee: '¥3,200 (~MYR 100)', neighborhood: 'Toyosu' },
      { name: 'Meiji Jingu Shrine', type: 'religious', description: 'Serene forested Shinto shrine dedicated to Emperor Meiji — a peaceful escape from the city bustle.', duration: '1–2 hours', bestTime: 'Morning', entryFee: 'Free', neighborhood: 'Harajuku' },
      { name: 'Tsukiji Outer Market', type: 'shopping', description: 'Tokyo\'s famous food market — graze on fresh sushi, tamagoyaki, and seafood skewers.', duration: '1–2 hours', bestTime: 'Morning', neighborhood: 'Tsukiji' },
      { name: 'Akihabara', type: 'shopping', description: 'Electric Town for anime, manga, retro games, electronics, and maid café experiences.', duration: '2–4 hours', bestTime: 'Afternoon', neighborhood: 'Akihabara' },
      { name: 'Shinjuku Gyoen', type: 'nature', description: 'Vast national garden blending French formal, English landscape, and Japanese traditional gardens.', duration: '2 hours', bestTime: 'Morning', entryFee: '¥500 (~MYR 16)', neighborhood: 'Shinjuku' },
      { name: 'Tokyo Skytree', type: 'landmark', description: 'World\'s tallest tower (634 m) with two observation decks for stunning panoramic views.', duration: '1–2 hours', bestTime: 'Evening', entryFee: '¥3,100 (~MYR 97)', neighborhood: 'Asakusa' },
    ],
    foods: [
      { name: 'Ramen', description: 'Rich tonkotsu, soy, or miso broth noodle soup — Tokyo is packed with legendary ramen shops.', where: 'Ichiran Ramen, Shinjuku', priceMYR: 'MYR 30–55', mealType: 'lunch' },
      { name: 'Sushi (Omakase)', description: 'Fresh-off-the-boat nigiri served at the chef\'s counter — a bucket-list Tokyo experience.', where: 'Tsukiji Market stalls or Sukiyabashi Jiro', priceMYR: 'MYR 80–500+', mealType: 'dinner' },
      { name: 'Yakitori', description: 'Skewered charcoal-grilled chicken (and offcuts) — best enjoyed at a smoky izakaya.', where: 'Yurakucho Yakitori Alley', priceMYR: 'MYR 40–80', mealType: 'dinner' },
      { name: 'Tamagoyaki', description: 'Sweet rolled omelette — a classic breakfast and market snack.', where: 'Tsukiji Outer Market', priceMYR: 'MYR 5–15', mealType: 'breakfast' },
      { name: 'Matcha Parfait', description: 'Layered dessert with matcha ice cream, red bean, mochi, and cornflakes.', where: 'Nana\'s Green Tea, Shibuya', priceMYR: 'MYR 35–60', mealType: 'snack' },
    ],
    tips: [
      'Get a Suica or Pasmo IC card — works on every train, subway, and many convenience stores.',
      'Carry cash: many traditional restaurants and shrines are cash-only.',
      'Tipping is not a custom in Japan — it can even cause offence.',
      'Book popular restaurants (especially omakase) weeks in advance.',
      'Convenience stores (7-Eleven, Lawson) sell surprisingly excellent hot meals 24/7.',
    ],
    avgDailyBudgetMYR: { budget: 220, comfort: 480, luxury: 1100 },
  },

  sydney: {
    city: 'Sydney', country: 'Australia', currency: 'AUD ($)',
    timezone: 'AEDT (UTC+11) / AEST (UTC+10)',
    bestSeason: 'October–April (spring/summer)',
    emoji: '🇦🇺',
    neighborhoods: ['Circular Quay', 'Darling Harbour', 'Bondi', 'Newtown', 'Manly'],
    attractions: [
      { name: 'Sydney Opera House', type: 'landmark', description: 'Jørn Utzon\'s architectural masterpiece — take a guided tour or catch a live performance.', duration: '1–3 hours', bestTime: 'Morning', entryFee: 'Tour: AUD $45 (~MYR 130)', neighborhood: 'Circular Quay' },
      { name: 'Bondi Beach', type: 'nature', description: 'Australia\'s most iconic beach — swim, surf, people-watch, or do the stunning Bondi to Coogee cliff walk.', duration: '3–6 hours', bestTime: 'Morning', entryFee: 'Free', neighborhood: 'Bondi' },
      { name: 'Sydney Harbour Bridge Climb', type: 'entertainment', description: 'Climb the iconic arch for unbeatable 360° harbour views — a once-in-a-lifetime experience.', duration: '3.5 hours', bestTime: 'Morning', entryFee: 'AUD $178 (~MYR 520)', neighborhood: 'Milsons Point' },
      { name: 'Taronga Zoo', type: 'entertainment', description: 'See koalas, kangaroos, and platypuses with stunning harbour views as a backdrop.', duration: '3–5 hours', bestTime: 'Morning', entryFee: 'AUD $46 (~MYR 135)', neighborhood: 'Mosman' },
      { name: 'The Rocks', type: 'landmark', description: 'Sydney\'s historic sandstone precinct with weekend markets, pubs, galleries, and harbour views.', duration: '2–3 hours', bestTime: 'Morning', neighborhood: 'Circular Quay' },
      { name: 'Royal Botanic Garden', type: 'nature', description: '30 hectares of stunning gardens running to the edge of Sydney Harbour — completely free.', duration: '1–2 hours', bestTime: 'Morning', entryFee: 'Free', neighborhood: 'CBD' },
      { name: 'Manly Beach & Ferry', type: 'nature', description: 'The Manly Ferry is one of the world\'s great commutes — 30 min across the stunning harbour.', duration: '3–5 hours', bestTime: 'Afternoon', entryFee: 'Ferry ~AUD $9 (~MYR 26)', neighborhood: 'Manly' },
    ],
    foods: [
      { name: 'Flat White Coffee', description: 'Sydney is a serious coffee city — velvety microfoam on a double espresso base.', where: 'Single O or Campos Coffee', priceMYR: 'MYR 18–28', mealType: 'breakfast' },
      { name: 'Fresh Seafood Platter', description: 'Sydney rock oysters, tiger prawns, Balmain bugs, and Morton Bay bugs — best at the fish markets.', where: 'Sydney Fish Market, Pyrmont', priceMYR: 'MYR 80–200', mealType: 'lunch' },
      { name: 'Avocado Toast', description: 'Sydney put avocado toast on the brunch map — expect creative toppings and sourdough bread.', where: 'Speedos Café, Bondi', priceMYR: 'MYR 35–55', mealType: 'breakfast' },
      { name: 'Meat Pie', description: 'Classic Australian comfort food — beef or lamb in flaky pastry with tomato sauce.', where: 'Harry\'s Café de Wheels, Woolloomooloo', priceMYR: 'MYR 15–25', mealType: 'lunch' },
      { name: 'Lamington', description: 'Sponge cake coated in chocolate and rolled in desiccated coconut — Australia\'s beloved national cake.', where: 'Any good bakery or café', priceMYR: 'MYR 8–18', mealType: 'snack' },
    ],
    tips: [
      'Load an Opal card for all public transport (trains, buses, ferries, light rail).',
      'Tap water is completely safe and delicious to drink.',
      'The Bondi to Coogee coastal walk is 6 km and free — wear sunscreen.',
      'UV is intense — 50+ SPF sunscreen is a must, even on cloudy days.',
      'Book Bridge Climb at least a week in advance, especially for sunrise slots.',
    ],
    avgDailyBudgetMYR: { budget: 300, comfort: 650, luxury: 1500 },
  },

  melbourne: {
    city: 'Melbourne', country: 'Australia', currency: 'AUD ($)',
    timezone: 'AEDT (UTC+11) / AEST (UTC+10)',
    bestSeason: 'March–May or September–November',
    emoji: '🇦🇺',
    neighborhoods: ['CBD / Laneways', 'Fitzroy', 'South Yarra', 'St Kilda', 'Carlton'],
    attractions: [
      { name: 'Federation Square', type: 'landmark', description: 'Melbourne\'s cultural heart — hosting free events, galleries (ACMI, NGV), markets, and Federation Bells.', duration: '2–3 hours', bestTime: 'Morning', entryFee: 'Free', neighborhood: 'CBD' },
      { name: 'Royal Botanic Gardens', type: 'nature', description: '94-hectare Victorian gardens by the Yarra River — perfect for picnics and peaceful walks.', duration: '2 hours', bestTime: 'Morning', entryFee: 'Free', neighborhood: 'South Yarra' },
      { name: 'Melbourne Laneways', type: 'entertainment', description: 'AC/DC Lane, Hosier Lane, and Caledonian Lane are world-famous for ever-changing street art.', duration: '1–2 hours', bestTime: 'Any', neighborhood: 'CBD' },
      { name: 'Queen Victoria Market', type: 'shopping', description: 'Southern Hemisphere\'s largest open-air market — fresh produce, deli goods, and artisan products since 1878.', duration: '2–3 hours', bestTime: 'Morning', neighborhood: 'North Melbourne' },
      { name: 'National Gallery of Victoria', type: 'museum', description: 'Australia\'s oldest and most visited art museum — don\'t miss the stained-glass ceiling in the Great Hall.', duration: '2–3 hours', bestTime: 'Afternoon', entryFee: 'Free (permanent collection)', neighborhood: 'Southbank' },
      { name: 'Great Ocean Road (Day Trip)', type: 'nature', description: 'One of the world\'s most scenic coastal drives featuring the Twelve Apostles limestone stacks.', duration: 'Full day', bestTime: 'Morning', entryFee: 'Car hire ~AUD $60 (~MYR 175)', neighborhood: 'Day trip' },
      { name: 'Eureka Skydeck 88', type: 'landmark', description: 'Shoot up to the 88th floor for panoramic 360° views. Try "The Edge" — glass cube jutting out from the building.', duration: '1 hour', bestTime: 'Evening', entryFee: 'AUD $26 (~MYR 76)', neighborhood: 'Southbank' },
    ],
    foods: [
      { name: 'Smashed Avocado Brunch', description: 'Melbourne essentially invented the smashed avo craze — served with feta, chilli flakes, and sourdough.', where: 'Brunetti, Carlton or Axil Coffee Roasters', priceMYR: 'MYR 30–55', mealType: 'breakfast' },
      { name: 'Yum Cha (Dim Sum)', description: 'Melbourne\'s large Chinese community means outstanding dim sum — trolleys of har gow, siu mai, and turnip cake.', where: 'Shark Fin House, Chinatown', priceMYR: 'MYR 40–80', mealType: 'lunch' },
      { name: 'Souvlaki', description: 'Melbourne has a huge Greek community — charcoal-grilled souvlaki with tzatziki in pita is a Melbourne staple.', where: 'Jim\'s Greek Tavern, Collingwood', priceMYR: 'MYR 20–40', mealType: 'lunch' },
      { name: 'Specialty Coffee', description: 'Melbourne is the world\'s specialty coffee capital — every laneway has a hidden third-wave café.', where: 'Patricia Coffee Brewers, CBD', priceMYR: 'MYR 15–25', mealType: 'breakfast' },
      { name: 'Baklava', description: 'Honey-soaked layered pastry — Oakleigh\'s Greek precinct has Melbourne\'s finest.', where: 'Elyros Café, Oakleigh', priceMYR: 'MYR 8–20', mealType: 'snack' },
    ],
    tips: [
      'Get a myki card for all public transport — trams in the CBD free zone are completely free.',
      'Melbourne\'s weather changes rapidly — "four seasons in one day" is a local saying. Layer up.',
      'Coffee culture is serious: ask for a "long black" (not Americano) and you\'ll earn local respect.',
      'Book Great Ocean Road tour or car hire at least 2 days ahead.',
      'AFL (Australian Rules Football) is a religion here — experiencing a live game at the MCG is unforgettable.',
    ],
    avgDailyBudgetMYR: { budget: 280, comfort: 600, luxury: 1350 },
  },

  bangkok: {
    city: 'Bangkok', country: 'Thailand', currency: 'THB (฿)',
    timezone: 'ICT (UTC+7)',
    bestSeason: 'November–February (cool & dry season)',
    emoji: '🇹🇭',
    neighborhoods: ['Silom', 'Sukhumvit', 'Khao San Road', 'Chinatown', 'Rattanakosin'],
    attractions: [
      { name: 'Grand Palace & Wat Phra Kaew', type: 'religious', description: 'Thailand\'s most sacred site — the dazzling Temple of the Emerald Buddha and the ornate Grand Palace complex.', duration: '3 hours', bestTime: 'Morning', entryFee: '฿500 (~MYR 68)', neighborhood: 'Rattanakosin' },
      { name: 'Wat Arun', type: 'religious', description: 'The Temple of Dawn — gleaming 80-metre spire adorned with colourful porcelain shards, best at sunset.', duration: '1 hour', bestTime: 'Evening', entryFee: '฿100 (~MYR 14)', neighborhood: 'Thonburi' },
      { name: 'Chatuchak Weekend Market', type: 'shopping', description: 'One of Asia\'s largest markets with 15,000+ stalls selling everything from antiques to street food.', duration: '3–5 hours', bestTime: 'Morning', neighborhood: 'Mo Chit' },
      { name: 'Floating Markets', type: 'entertainment', description: 'Damnoen Saduak or Amphawa floating markets — vendors selling fresh fruit, pad thai, and coconut ice cream from boats.', duration: '3–4 hours', bestTime: 'Morning', entryFee: '฿200–300 (~MYR 27–41)', neighborhood: 'Amphawa (day trip)' },
      { name: 'Wat Pho', type: 'religious', description: 'Home to the 46-metre gold-leaf Reclining Buddha — also Bangkok\'s best place for a traditional Thai massage.', duration: '1–2 hours', bestTime: 'Afternoon', entryFee: '฿200 (~MYR 27)', neighborhood: 'Rattanakosin' },
      { name: 'Lumphini Park', type: 'nature', description: 'Bangkok\'s green lung — spot monitor lizards, do tai chi, or hire a paddleboat on the lake.', duration: '1–2 hours', bestTime: 'Morning', entryFee: 'Free', neighborhood: 'Silom' },
    ],
    foods: [
      { name: 'Pad Thai', description: 'Stir-fried rice noodles with tofu or shrimp, bean sprouts, peanuts, and tamarind — Thailand\'s most iconic dish.', where: 'Thip Samai, Rattanakosin (the best in Bangkok)', priceMYR: 'MYR 10–25', mealType: 'lunch' },
      { name: 'Tom Yum Goong', description: 'Fiery and sour prawn soup with lemongrass, galangal, and kaffir lime leaves.', where: 'Jeh O Chula, Din Daeng', priceMYR: 'MYR 20–50', mealType: 'dinner' },
      { name: 'Mango Sticky Rice', description: 'Fresh ripe mango over glutinous rice drenched in sweet coconut milk — a must-try dessert.', where: 'Aw Taw Kaw Market or street carts', priceMYR: 'MYR 10–20', mealType: 'snack' },
      { name: 'Khao Man Gai', description: 'Poached chicken over fragrant rice cooked in chicken broth — simple, comforting, and phenomenal.', where: 'Kaiton Pratunam, Pratunam', priceMYR: 'MYR 8–18', mealType: 'breakfast' },
      { name: 'Som Tum (Papaya Salad)', description: 'Green papaya shredded with chilli, lime, fish sauce, and peanuts — fresh, spicy, and addictive.', where: 'Any street cart or Som Tum Der, Silom', priceMYR: 'MYR 8–20', mealType: 'lunch' },
    ],
    tips: [
      'Download the Bangkok MRT app and top up a Rabbit card for BTS Skytrain travel.',
      'Tuk-tuk drivers near tourist spots will try to take you to gem shops — always agree on price first.',
      'Dress modestly to enter temples: covered shoulders and knees are mandatory.',
      'Street food near the Grand Palace is cheaper than tourist restaurants but just as good.',
      'Avoid the hottest part of the day (12–3 pm) for outdoor sightseeing — take a taxi or rest.',
    ],
    avgDailyBudgetMYR: { budget: 120, comfort: 280, luxury: 650 },
  },

  bali: {
    city: 'Bali', country: 'Indonesia', currency: 'IDR (Rp)',
    timezone: 'WITA (UTC+8)',
    bestSeason: 'April–October (dry season)',
    emoji: '🇮🇩',
    neighborhoods: ['Seminyak', 'Ubud', 'Canggu', 'Nusa Dua', 'Kuta'],
    attractions: [
      { name: 'Tanah Lot Temple', type: 'religious', description: 'Iconic sea temple perched on a rocky outcrop — spectacular sunset photography location.', duration: '1–2 hours', bestTime: 'Evening', entryFee: 'IDR 60,000 (~MYR 17)', neighborhood: 'Tabanan' },
      { name: 'Tegallalang Rice Terraces', type: 'nature', description: 'Stunning emerald-green stepped rice paddies with swings and photo spots above the canopy.', duration: '2 hours', bestTime: 'Morning', entryFee: 'IDR 15,000 (~MYR 4)', neighborhood: 'Ubud' },
      { name: 'Sacred Monkey Forest Sanctuary', type: 'nature', description: 'Ancient forest sanctuary with 1,200 resident macaques and three atmospheric Hindu temples.', duration: '1.5 hours', bestTime: 'Afternoon', entryFee: 'IDR 80,000 (~MYR 22)', neighborhood: 'Ubud' },
      { name: 'Mount Batur Sunrise Trek', type: 'nature', description: 'Hike up an active volcano (1,717 m) to watch the sunrise above the clouds — utterly unforgettable.', duration: '6–7 hours (2 am start)', bestTime: 'Morning', entryFee: 'Guide ~USD $35 (~MYR 160)', neighborhood: 'Kintamani' },
      { name: 'Seminyak Beach Sunset', type: 'nature', description: 'Watch Bali\'s legendary sunset at La Plancha or Potato Head beach club with a cocktail in hand.', duration: '2 hours', bestTime: 'Evening', neighborhood: 'Seminyak' },
      { name: 'Tirta Empul Temple', type: 'religious', description: 'Balinese Hindu water temple where you can participate in a traditional purification ritual.', duration: '1.5 hours', bestTime: 'Morning', entryFee: 'IDR 50,000 (~MYR 14)', neighborhood: 'Tampaksiring' },
    ],
    foods: [
      { name: 'Nasi Goreng', description: 'Indonesia\'s quintessential fried rice with fried egg, krupuk crackers, and pickled vegetables.', where: 'Warung Ibu Oka, Ubud', priceMYR: 'MYR 8–20', mealType: 'any' },
      { name: 'Babi Guling (Suckling Pig)', description: 'Bali\'s most famous dish — spit-roasted pig with crispy skin, turmeric rice, and lawar vegetable mix.', where: 'Warung Ibu Oka, Ubud', priceMYR: 'MYR 25–55', mealType: 'lunch' },
      { name: 'Sate Lilit', description: 'Balinese-style satay of minced fish or chicken pressed onto lemongrass sticks and grilled.', where: 'Night markets in Seminyak', priceMYR: 'MYR 10–25', mealType: 'dinner' },
      { name: 'Smoothie Bowl', description: 'Bali popularised the açaí/dragonfruit smoothie bowl trend — gorgeous Instagram-worthy bowls everywhere in Canggu.', where: 'Nude Food, Canggu', priceMYR: 'MYR 25–45', mealType: 'breakfast' },
      { name: 'Jamu', description: 'Traditional Balinese herbal drink made from turmeric, ginger, and tamarind — both a health tonic and cultural experience.', where: 'Any traditional warung', priceMYR: 'MYR 5–12', mealType: 'breakfast' },
    ],
    tips: [
      'Rent a scooter (IDR 60,000–80,000/day) to get around — just bring your international driving licence.',
      'The water is not safe to drink — stick to bottled water or refill stations.',
      'Dress respectfully at temples: sarong and sash are usually provided for a small fee.',
      'Book Mount Batur trek guide in advance — pre-arranged guides are safer and often cheaper.',
      'Bargaining is expected at markets; start at 50% of the asking price.',
    ],
    avgDailyBudgetMYR: { budget: 110, comfort: 250, luxury: 600 },
  },

  singapore: {
    city: 'Singapore', country: 'Singapore', currency: 'SGD ($)',
    timezone: 'SGT (UTC+8)',
    bestSeason: 'February–April (drier period)',
    emoji: '🇸🇬',
    neighborhoods: ['Marina Bay', 'Orchard Road', 'Little India', 'Chinatown', 'Sentosa'],
    attractions: [
      { name: 'Gardens by the Bay', type: 'nature', description: 'Futuristic Supertrees and the iconic Cloud Forest & Flower Dome conservatories — magical at night during the light show.', duration: '3–4 hours', bestTime: 'Evening', entryFee: 'Free (garden); SGD $53 (~MYR 185) for conservatories', neighborhood: 'Marina Bay' },
      { name: 'Marina Bay Sands SkyPark', type: 'landmark', description: 'The iconic three-tower hotel with the world\'s most Instagrammed infinity pool on the 57th floor.', duration: '2 hours', bestTime: 'Evening', entryFee: 'Observation deck: SGD $26 (~MYR 91)', neighborhood: 'Marina Bay' },
      { name: 'Sentosa Island', type: 'entertainment', description: 'Universal Studios Singapore, S.E.A. Aquarium, beaches, and cable car — a full day of thrills.', duration: 'Full day', bestTime: 'Any', entryFee: 'Universal Studios: SGD $83 (~MYR 290)', neighborhood: 'Sentosa' },
      { name: 'Hawker Centres', type: 'shopping', description: 'UNESCO-listed hawker centres — Maxwell, Lau Pa Sat, Chinatown Complex — the soul of Singapore food culture.', duration: '1–2 hours', bestTime: 'Any', entryFee: 'Free (pay per dish)', neighborhood: 'Citywide' },
      { name: 'Little India', type: 'landmark', description: 'A riot of colour, fragrance, and culture — Sri Veeramakaliamman Temple, Mustafa Centre, and floral garland makers.', duration: '2–3 hours', bestTime: 'Afternoon', neighborhood: 'Little India' },
      { name: 'Singapore Zoo & Night Safari', type: 'entertainment', description: 'Rated one of the world\'s best zoos — Night Safari is the world\'s first nocturnal wildlife park.', duration: '3–5 hours', bestTime: 'Evening', entryFee: 'Night Safari SGD $55 (~MYR 192)', neighborhood: 'Mandai' },
    ],
    foods: [
      { name: 'Hainanese Chicken Rice', description: 'Singapore\'s national dish — poached chicken over fragrant rice with chilli sauce and ginger paste.', where: 'Tian Tian, Maxwell Food Centre', priceMYR: 'MYR 15–30', mealType: 'lunch' },
      { name: 'Chilli Crab', description: 'Fresh Sri Lankan crab stir-fried in a tangy, sweet, and spicy chilli-tomato sauce — serve with mantou buns.', where: 'No Signboard Seafood, Geylang', priceMYR: 'MYR 120–250', mealType: 'dinner' },
      { name: 'Char Kway Teow', description: 'Flat rice noodles stir-fried in a wok with Chinese sausage, cockles, bean sprouts, and dark soy.', where: 'Outram Park Fried Kway Teow Mee, CBD', priceMYR: 'MYR 10–20', mealType: 'lunch' },
      { name: 'Kaya Toast Set', description: 'Toasted bread with kaya (coconut jam) and butter, with soft-boiled eggs and kopi (Singaporean coffee).', where: 'Ya Kun Kaya Toast (islandwide)', priceMYR: 'MYR 10–18', mealType: 'breakfast' },
      { name: 'Ice Kacang', description: 'Shaved ice mountain drizzled with brightly coloured syrups and topped with red bean, corn, grass jelly, and attap chee.', where: 'Old Chang Kee or any hawker centre', priceMYR: 'MYR 5–12', mealType: 'snack' },
    ],
    tips: [
      'Get an EZ-Link card for all MRT and bus travel — Singapore public transport is world-class.',
      'Air-conditioning is everywhere; carry a light jacket for malls and restaurants.',
      'Fines are strictly enforced: no eating on MRT, no littering, no chewing gum.',
      'Hawker centres are far better value and quality than tourist restaurants.',
      'Changi Airport has free movies, a rooftop pool, and a butterfly garden — arrive early.',
    ],
    avgDailyBudgetMYR: { budget: 200, comfort: 450, luxury: 950 },
  },

  dubai: {
    city: 'Dubai', country: 'UAE', currency: 'AED (د.إ)',
    timezone: 'GST (UTC+4)',
    bestSeason: 'November–March (cool & dry)',
    emoji: '🇦🇪',
    neighborhoods: ['Downtown', 'Dubai Marina', 'Jumeirah', 'Deira', 'Palm Jumeirah'],
    attractions: [
      { name: 'Burj Khalifa', type: 'landmark', description: 'World\'s tallest building (828 m) — At the Top (level 124/125) offers staggering city and desert views.', duration: '2 hours', bestTime: 'Evening', entryFee: 'AED 135 (~MYR 176)', neighborhood: 'Downtown' },
      { name: 'Dubai Mall', type: 'shopping', description: 'World\'s largest shopping mall with an indoor ice rink, Dubai Aquarium, and a waterfall feature.', duration: '3–6 hours', bestTime: 'Afternoon', entryFee: 'Free (entry)', neighborhood: 'Downtown' },
      { name: 'Palm Jumeirah & Atlantis', type: 'landmark', description: 'The iconic palm-shaped man-made island — take the Palm Monorail or visit Aquaventure Waterpark.', duration: '4–6 hours', bestTime: 'Any', neighborhood: 'Palm Jumeirah' },
      { name: 'Dubai Desert Safari', type: 'nature', description: 'Dune bashing in 4x4s, sandboarding, camel riding, and dinner under the stars in a Bedouin camp.', duration: '6–7 hours', bestTime: 'Evening', entryFee: '~AED 180–280 (~MYR 235–365)', neighborhood: 'Desert (day trip)' },
      { name: 'Dubai Creek & Gold Souk', type: 'shopping', description: 'Cross the creek by abra (water taxi) and explore the glittering Gold Souk and Spice Souk in old Dubai.', duration: '2–3 hours', bestTime: 'Morning', neighborhood: 'Deira' },
      { name: 'Dubai Frame', type: 'landmark', description: 'A 150-metre-tall picture frame with Old Dubai on one side and the futuristic skyline on the other.', duration: '1.5 hours', bestTime: 'Afternoon', entryFee: 'AED 50 (~MYR 65)', neighborhood: 'Zabeel' },
    ],
    foods: [
      { name: 'Shawarma', description: 'Thin-sliced spiced meat (chicken or lamb) wrapped in flatbread with garlic sauce and pickles — Dubai\'s best street food.', where: 'Al Safadi, Deira or any street cart', priceMYR: 'MYR 10–20', mealType: 'lunch' },
      { name: 'Camel Burger', description: 'A Dubai novelty — juicy camel meat burger seasoned with local spices. Uniquely memorable.', where: 'Switch Restaurant, Mall of the Emirates', priceMYR: 'MYR 55–90', mealType: 'lunch' },
      { name: 'Mezze Platter', description: 'Spread of hummus, moutabal, fattoush, grape leaves, and warm pita — perfect for sharing.', where: 'Zaroob, Dubai Marina', priceMYR: 'MYR 50–100', mealType: 'dinner' },
      { name: 'Luqaimat', description: 'Crispy deep-fried dumplings drizzled with date syrup and sesame seeds — a traditional Emirati sweet.', where: 'Local Emirate restaurants or Al Fanar', priceMYR: 'MYR 20–40', mealType: 'snack' },
      { name: 'Arabic Coffee & Dates', description: 'Cardamom-infused light coffee (qahwa) served with Medjool dates — traditional Emirati hospitality in a cup.', where: 'Any traditional café or hotel lobby', priceMYR: 'MYR 15–30', mealType: 'any' },
    ],
    tips: [
      'Download the Careem app — rides are affordable and reliable across the city.',
      'Dress modestly in traditional areas (Deira, Gold Souk) and malls: covered shoulders and knees.',
      'Alcohol is only served in licensed hotel venues — not in local restaurants.',
      'The Dubai Metro is excellent and cheap; get a Nol card.',
      'Book desert safari at least 2–3 days in advance, especially in peak season.',
    ],
    avgDailyBudgetMYR: { budget: 300, comfort: 700, luxury: 1800 },
  },

  seoul: {
    city: 'Seoul', country: 'South Korea', currency: 'KRW (₩)',
    timezone: 'KST (UTC+9)',
    bestSeason: 'March–May (cherry blossom) or September–November',
    emoji: '🇰🇷',
    neighborhoods: ['Gangnam', 'Insadong', 'Hongdae', 'Itaewon', 'Myeongdong'],
    attractions: [
      { name: 'Gyeongbokgung Palace', type: 'landmark', description: 'Korea\'s grandest Joseon-era palace — Changing of the Royal Guard ceremony daily at 10 am and 2 pm.', duration: '2–3 hours', bestTime: 'Morning', entryFee: '₩3,000 (~MYR 11)', neighborhood: 'Jongno' },
      { name: 'Bukchon Hanok Village', type: 'landmark', description: '600-year-old preserved hanok (traditional Korean house) village with stunning views of the city.', duration: '2–3 hours', bestTime: 'Morning', entryFee: 'Free', neighborhood: 'Jongno' },
      { name: 'N Seoul Tower', type: 'landmark', description: 'Seoul\'s iconic telecommunications tower on Namsan mountain — love locks, city panoramas, and night views.', duration: '2 hours', bestTime: 'Evening', entryFee: '₩21,000 (~MYR 77)', neighborhood: 'Namsan' },
      { name: 'Myeongdong Shopping Street', type: 'shopping', description: 'Seoul\'s busiest shopping street packed with K-beauty brands, street food, and fashion from noon until midnight.', duration: '3–4 hours', bestTime: 'Afternoon', neighborhood: 'Jung-gu' },
      { name: 'DMZ Tour', type: 'entertainment', description: 'A guided tour to the Korean Demilitarised Zone — one of the world\'s most surreal travel experiences.', duration: '7–8 hours', bestTime: 'Morning', entryFee: 'Tour ~KRW 75,000 (~MYR 275)', neighborhood: 'Day trip from Seoul' },
      { name: 'Lotte World', type: 'entertainment', description: 'World\'s largest indoor theme park combined with an outdoor Magic Island on a lake.', duration: '5–8 hours', bestTime: 'Any', entryFee: '₩62,000 (~MYR 228)', neighborhood: 'Jamsil' },
    ],
    foods: [
      { name: 'Korean BBQ (Samgyeopsal)', description: 'Thick pork belly strips grilled table-side with ssam (lettuce wraps), kimchi, and ssamjang dipping sauce.', where: 'Maple Tree House, Itaewon', priceMYR: 'MYR 50–120', mealType: 'dinner' },
      { name: 'Bibimbap', description: 'Rice topped with seasoned vegetables, beef, egg, and gochujang (chilli paste) — mix everything together and eat.', where: 'Gogung Bibimbap, Myeongdong', priceMYR: 'MYR 30–55', mealType: 'lunch' },
      { name: 'Tteokbokki', description: 'Chewy rice cakes in a spicy-sweet gochujang sauce — Seoul\'s most beloved street snack.', where: 'Gwangjang Market street food stalls', priceMYR: 'MYR 8–18', mealType: 'snack' },
      { name: 'Hotteok (Sweet Pancake)', description: 'Crispy street pancake filled with brown sugar, cinnamon, and crushed nuts — best eaten hot.', where: 'Insadong street vendors', priceMYR: 'MYR 5–12', mealType: 'snack' },
      { name: 'Haemul Pajeon', description: 'Crispy seafood and spring onion pancake — thick, golden, and best enjoyed with makgeolli rice wine.', where: 'Gwangjang Market', priceMYR: 'MYR 20–40', mealType: 'lunch' },
    ],
    tips: [
      'Get a T-money card for all metro and bus travel — also valid in taxis.',
      'Download Naver Maps (not Google Maps) — it has far better Korean transit directions.',
      'Most BBQ restaurants have a minimum order of 2 portions — come with friends.',
      'K-beauty products are 30–60% cheaper in Seoul than overseas — Olive Young is your friend.',
      'Cherry blossom season (late March–mid April) gets very crowded — book accommodation months in advance.',
    ],
    avgDailyBudgetMYR: { budget: 200, comfort: 430, luxury: 950 },
  },
};

// ─── Default fallback for unknown destinations ────────────────────────────────

const DEFAULT_DESTINATION: DestinationInfo = {
  city: 'Your Destination', country: 'International', currency: 'Local Currency',
  timezone: 'Local Timezone', bestSeason: 'Year-round', emoji: '✈️',
  neighborhoods: ['City Centre', 'Old Town', 'Waterfront', 'Market District'],
  attractions: [
    { name: 'City Historic Centre', type: 'landmark', description: 'Explore the heart of the city with its historical monuments and vibrant local life.', duration: '2–3 hours', bestTime: 'Morning', neighborhood: 'City Centre' },
    { name: 'Local Art Museum', type: 'museum', description: 'Discover local culture, art, and history at the city\'s premier museum.', duration: '2 hours', bestTime: 'Afternoon', entryFee: 'Varies', neighborhood: 'City Centre' },
    { name: 'Main Market / Bazaar', type: 'shopping', description: 'Browse local crafts, fresh produce, and sample regional street food.', duration: '2 hours', bestTime: 'Morning', neighborhood: 'Market District' },
    { name: 'Waterfront Walk', type: 'nature', description: 'Scenic promenade with views, cafés, and a relaxing atmosphere.', duration: '1–2 hours', bestTime: 'Evening', neighborhood: 'Waterfront' },
  ],
  foods: [
    { name: 'Local Speciality Dish', description: 'Ask locals for their recommended dish — every city has a hidden culinary gem.', where: 'Local restaurants', priceMYR: 'MYR 15–50', mealType: 'lunch' },
    { name: 'Street Food Snacks', description: 'Street food stalls offer the most authentic and affordable local flavours.', where: 'Main market area', priceMYR: 'MYR 5–20', mealType: 'snack' },
  ],
  tips: [
    'Research local customs and greetings before arrival.',
    'Always carry some local cash for small vendors and markets.',
    'Download offline maps for your destination before departure.',
    'Check visa requirements well in advance of travel.',
    'Keep digital and physical copies of all travel documents.',
  ],
  avgDailyBudgetMYR: { budget: 200, comfort: 450, luxury: 1000 },
};

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getDestinationInfo(cityName: string): Promise<DestinationInfo> {
  await new Promise((r) => setTimeout(r, 150));
  const key = cityName.toLowerCase().trim();
  return DESTINATIONS[key] ?? { ...DEFAULT_DESTINATION, city: cityName };
}

export function getSupportedDestinations(): string[] {
  return Object.values(DESTINATIONS).map((d) => d.city);
}

export function getAttractionsByType(info: DestinationInfo, types: Attraction['type'][]): Attraction[] {
  return info.attractions.filter((a) => types.includes(a.type));
}

export function getFoodsByMealType(info: DestinationInfo, mealType: MustTryFood['mealType']): MustTryFood[] {
  return info.foods.filter((f) => f.mealType === mealType || f.mealType === 'any');
}

/**
 * Generates a structured day-by-day itinerary from destination data.
 * Used as a fallback when no AI key is available.
 */
export function generateTemplatePlan(
  info: DestinationInfo,
  numDays: number,
  preferences: string[],
): DayTemplate[] {
  const isRelaxed    = preferences.some(p => p.includes('Relaxed'));
  const isCultural   = preferences.some(p => p.includes('Cultural') || p.includes('Historical'));
  const isNature     = preferences.some(p => p.includes('Nature'));

  const shuffled = [...info.attractions].sort((_a, b) => {
    if (isCultural) return (b.type === 'museum' || b.type === 'religious') ? 1 : -1;
    if (isNature)   return b.type === 'nature' ? 1 : -1;
    return 0;
  });

  const foods        = info.foods;
  const days: DayTemplate[] = [];
  const activitiesPerDay = isRelaxed ? 2 : 3;

  for (let d = 0; d < numDays; d++) {
    const slice = shuffled.slice(d * activitiesPerDay, d * activitiesPerDay + activitiesPerDay);
    if (slice.length === 0) {
      slice.push(...shuffled.slice(0, activitiesPerDay));
    }

    const breakfast = foods.find(f => f.mealType === 'breakfast') ?? foods[0];
    const lunch     = foods.find(f => f.mealType === 'lunch')     ?? foods[1 % foods.length];
    const dinner    = foods.find(f => f.mealType === 'dinner')    ?? foods[foods.length - 1];

    days.push({
      dayNumber: d + 1,
      theme: d === 0 ? 'Arrival & First Impressions' : d === numDays - 1 ? 'Final Exploration & Departure Prep' : `Explore ${info.neighborhoods[d % info.neighborhoods.length]}`,
      morningActivity:   slice[0] ?? null,
      afternoonActivity: slice[1] ?? null,
      eveningActivity:   slice[2] ?? null,
      meals: { breakfast, lunch, dinner },
      tip: info.tips[d % info.tips.length],
    });
  }

  return days;
}

export interface DayTemplate {
  dayNumber: number;
  theme: string;
  morningActivity: Attraction | null;
  afternoonActivity: Attraction | null;
  eveningActivity: Attraction | null;
  meals: {
    breakfast: MustTryFood;
    lunch: MustTryFood;
    dinner: MustTryFood;
  };
  tip: string;
}
