import { Neighborhood } from "../types";

export const neighborhoods: Neighborhood[] = [
  {
    id: "presidio",
    name: "Presidio & Richmond North",
    description: "A sprawling national park site at the Golden Gate, characterized by historic army posts, eucalyptus forests, and spectacular beach views. Perfect for quiet nature walks.",
    vibe: "Serene, historic, wooded, and scenic. Extremely safe and family-friendly.",
    highlights: [
      "Tunnel Tops Park (stunning Golden Gate views)",
      "Baker Beach & Crissy Field",
      "Disney Family Museum",
      "Historic Main Post architecture"
    ],
    transitConnections: [
      "Presidio GO Shuttle (Free transit around the park and to Downtown)",
      "Muni Bus 28 (North-South via 19th Ave to Daly City BART)",
      "Muni Bus 43 (To Cole Valley & Haight)"
    ],
    safetyTips: "Extremely safe during the day. Dress in layers; winds from the Golden Gate are cold and swift, even in July.",
    secrets: "Take the free Presidio GO shuttle from the SalesForce Transit Center directly to the Presidio. It's the best free ride in the city.",
    svgPath: "M 180,60 L 450,60 L 450,180 L 320,180 L 180,180 Z",
    labelX: 315,
    labelY: 120,
    fillColor: "#e6f4ea",
    borderColor: "#34a853",
  },
  {
    id: "richmond",
    name: "Outer & Inner Richmond",
    description: "A massive, diverse neighborhood in northwest SF known as 'New Chinatown'. Bordered by Golden Gate Park, the Presidio, and Ocean Beach. Renowned for its unparalleled Asian culinary scene.",
    vibe: "Foggy, authentic, delicious, and laid-back. High-density residential feel.",
    highlights: [
      "Clement Street food corridor (dim sum, bakeries, burmese)",
      "Land's End & Sutro Baths ruins",
      "Green Apple Books (legendary indie bookstore)",
      "Golden Gate Park's de Young Museum & Japanese Tea Garden (South border)"
    ],
    transitConnections: [
      "Muni Bus 38 / 38R Geary (Super-frequent Bus Rapid Transit directly to Downtown)",
      "Muni Bus 1 California (Scenic slow ride across North SF to Financial District)",
      "Muni Bus 28 (To Golden Gate Bridge or Daly City BART)"
    ],
    safetyTips: "Very safe residential area. If parking near Land's End or Sutro Baths, NEVER leave anything in your car (rental cars are targeted daily).",
    secrets: "Clement Street's Sunday Farmers Market is less crowded than Ferry Plaza and features spectacular local bakeries.",
    svgPath: "M 100,180 L 400,180 L 400,380 L 100,380 Z",
    labelX: 250,
    labelY: 280,
    fillColor: "#f1f3f4",
    borderColor: "#9aa0a6",
  },
  {
    id: "marina",
    name: "Marina & Pacific Heights",
    description: "A trendy, upscale district on the northern waterfront boasting historic multi-million dollar Victorian mansions, active lifestyles, boutique shopping along Union/Chestnut, and sweeping views of Alcatraz.",
    vibe: "Chic, polished, youthful, and highly active. Sunnier than the western districts.",
    highlights: [
      "Palace of Fine Arts (iconic Roman-style rotunda)",
      "Marina Green (running, kite flying, Yacht harbor)",
      "Lafayette Park & Alta Plaza Park (epic hill views in Pac Heights)",
      "Chestnut Street boutiques and juice bars"
    ],
    transitConnections: [
      "Muni Bus 22 Fillmore (To Western Addition, Mission, and Dogpatch)",
      "Muni Bus 30 Stockton (To Chinatown, North Beach, Union Square)",
      "Muni Bus 45 Union-Stockton (Direct transit through historic tunnel)"
    ],
    safetyTips: "Generally very safe. Pacific Heights is one of the most secure neighborhoods. Standard urban awareness applies at night on active commercial strips.",
    secrets: "Walk up the Lyon Street Steps from Pacific Heights down into the Marina for a breathtaking, flower-lined view of the Palace of Fine Arts.",
    svgPath: "M 450,60 L 650,60 L 650,180 L 450,180 Z",
    labelX: 550,
    labelY: 120,
    fillColor: "#e8f0fe",
    borderColor: "#4285f4",
  },
  {
    id: "northbeach",
    name: "North Beach & Chinatown",
    description: "Two dense, historic cultural epicenters layered next to each other. Chinatown is the oldest in North America, filled with herbalists and dim sum. North Beach is 'Little Italy', home of Beat generation history, espresso, and pizza.",
    vibe: "Energetic, bustling, historic, aromatic, and dense. Classic SF hill steps.",
    highlights: [
      "Coit Tower (atop Telegraph Hill for 360-degree views)",
      "City Lights Bookstore (Beat Generation landmark)",
      "Stockton Street food stalls & Portsmouth Square",
      "Washington Square Park (sitting under Sts. Peter and Paul Church)"
    ],
    transitConnections: [
      "Muni Central Subway T-Third (Chinatown-Rose Pak Station to Union Sq & Caltrain)",
      "Cable Car - Powell-Mason & Powell-Hyde lines",
      "Muni Bus 30 Stockton & 8 Bayshore (Heavy passenger commuter lines to Downtown)",
      "Muni Bus 39 (Coit Tower shuttle)"
    ],
    safetyTips: "Chinatown is extremely safe. North Beach can get boisterous during weekend nightlife. Watch your step on steep sidewalks and hills.",
    secrets: "Visit the Golden Gate Fortune Cookie Factory in Ross Alley to watch fortune cookies being rolled by hand, then buy a bag of warm, fresh ones.",
    svgPath: "M 650,60 L 820,60 L 820,180 L 650,180 Z",
    labelX: 735,
    labelY: 120,
    fillColor: "#fce8e6",
    borderColor: "#ea4335",
  },
  {
    id: "downtown",
    name: "Downtown & Financial District",
    description: "The commercial heartbeat of the Bay Area, featuring sleek glass skyscrapers, historic architecture, the SalesForce Transit Center, and the iconic Ferry Building on the waterfront.",
    vibe: "Fast-paced, professional, architectural, and transitional. Active by day, quieter at night.",
    highlights: [
      "Ferry Building Marketplace (local food, Tuesday/Saturday Farmers Market)",
      "SalesForce Park (stunning 5.4-acre rooftop floating park)",
      "Embarcadero waterfront promenade",
      "Montgomery Street (Wall Street of the West)"
    ],
    transitConnections: [
      "BART Lines (Embarcadero, Montgomery, Powell, Civic Center stations)",
      "Muni Metro Subway (All lines J, K, L, M, N, T running underground along Market)",
      "Ferry lines (To Oakland, Alameda, Larkspur, Sausalito, Vallejo)",
      "Cable Car - California Street Line"
    ],
    safetyTips: "Busy and highly policed during business hours. Market Street near Mid-Market/Civic Center can have visible homelessness; stay alert. Take BART/Metro to bypass surface street traffic.",
    secrets: "SalesForce Park is completely free to enter and has public gondola rides from ground level. It features a lush botanical forest, water fountains, and free public events.",
    svgPath: "M 820,60 L 950,60 L 950,250 L 780,250 L 780,180 L 820,180 Z",
    labelX: 865,
    labelY: 155,
    fillColor: "#fef7e0",
    borderColor: "#fbbc04",
  },
  {
    id: "soma",
    name: "SoMa (South of Market)",
    description: "A massive warehouse-turned-tech district. SoMa houses start-ups, museums like SFMOMA, Oracle Park (Giants Stadium), nightclubs, and major transit hubs.",
    vibe: "Industrial, artsy, modern, diverse, and patchy. Dense loft architecture.",
    highlights: [
      "SFMOMA (Museum of Modern Art)",
      "Oracle Park (San Francisco Giants Baseball)",
      "Yerba Buena Gardens & Center for the Arts",
      "Folsom Street culture & nightlife"
    ],
    transitConnections: [
      "Caltrain Depot (4th & King - regional rail to Silicon Valley / San Jose)",
      "Muni Central Subway T-Third (Connects Caltrain directly to Union Square & Chinatown)",
      "BART & Muni Metro (SOMA borders the south side of the Market Street Subway)",
      "Bay Bridge access point"
    ],
    safetyTips: "Varies block-by-block. Blocks closer to Mid-Market/6th street can feel highly distressed. Stick to well-trafficked, lit corridors at night.",
    secrets: "SFMOMA's entire ground floor is free and open to the public without a ticket. It houses massive Richard Serra steel sculptures and beautiful coffee lounges.",
    svgPath: "M 780,250 L 950,250 L 950,450 L 680,450 Z",
    labelX: 820,
    labelY: 340,
    fillColor: "#f3e8fd",
    borderColor: "#af52de",
  },
  {
    id: "westernaddition",
    name: "Western Addition & Hayes Valley",
    description: "Centrally located districts. Hayes Valley is a trendy pedestrian-first shopping haven with high-end designer boutiques and outdoor plazas. Western Addition is historically rich in jazz culture and Victorian homes.",
    vibe: "Trendy, artistic, central, walkable, and fashionable.",
    highlights: [
      "Alamo Square's Painted Ladies (iconic Victorian row with skyline behind)",
      "Hayes Valley central plaza (outdoor container shops, beer gardens)",
      "SF Jazz Center & Symphony Hall",
      "Fillmore Street music district"
    ],
    transitConnections: [
      "Muni Bus 21 Hayes (Central East-West transit directly to Market St)",
      "Muni Bus 5 / 5R Fulton (Fast express bus to Golden Gate Park & Ocean Beach)",
      "Muni Bus 22 Fillmore & 49 Van Ness BRT (Rapid North-South lines)"
    ],
    safetyTips: "Very safe around Hayes Valley commercial corridors. Use standard city street awareness in adjacent blocks at night.",
    secrets: "Order a coffee from the retrofitted shipping containers in Hayes Valley's Patricia's Green park, then walk 4 blocks uphill to Alamo Square for sunset.",
    svgPath: "M 520,180 L 680,180 L 680,350 L 520,350 Z",
    labelX: 600,
    labelY: 260,
    fillColor: "#e6f4ea",
    borderColor: "#34a853",
  },
  {
    id: "sunset",
    name: "Outer & Inner Sunset",
    description: "The largest district in SF, expanding all the way to Ocean Beach. Inner Sunset is a bustling student and dining center. Outer Sunset is a quiet surf-haven surrounded by coastal dunes, fog, and backyard gardens.",
    vibe: "Foggy, salty, neighborhoody, family-oriented, and slow-paced. Peaceful beach energy.",
    highlights: [
      "Ocean Beach (bonfires, surfing, endless coastal walks)",
      "Inner Sunset food scene (9th Ave & Irving, ramen, bakeries)",
      "Grandview Park (epic 360-degree hill viewpoint via tiled steps)",
      "San Francisco Zoo (Southwest corner)"
    ],
    transitConnections: [
      "Muni Metro N-Judah (The crown jewel of transit: Sunset's direct underground link to Downtown)",
      "Muni Bus 28 (Via 19th Ave to Golden Gate Bridge or Daly City BART)",
      "Muni Bus 7 Haight (Connects Sunset to Haight, Lower Haight, and Downtown)"
    ],
    safetyTips: "Extremely safe and quiet. The ocean is beautiful but possesses highly dangerous rip currents—NEVER swim at Ocean Beach. Wear a thick jacket; Sunset is SF's coldest district.",
    secrets: "Climb the 16th Avenue Tiled Steps (gorgeous mosaic artwork), then continue up to Grandview Park for a stunning 360 view of the Golden Gate, Pacific, and Downtown.",
    svgPath: "M 100,430 L 400,430 L 400,730 L 100,730 Z",
    labelX: 250,
    labelY: 580,
    fillColor: "#f1f3f4",
    borderColor: "#9aa0a6",
  },
  {
    id: "ggpark",
    name: "Golden Gate Park",
    description: "A 1,017-acre public park that is 20% larger than NYC's Central Park. Runs from the center of SF directly to the Pacific Ocean. Home to bison, lakes, museums, and forests.",
    vibe: "Lush, historic, vast, and relaxing. An urban oasis.",
    highlights: [
      "California Academy of Sciences & de Young Museum",
      "Conservatory of Flowers & Japanese Tea Garden",
      "Bison Paddock (live American bison!)",
      "JFK Promenade (miles of car-free paved trails)"
    ],
    transitConnections: [
      "Muni Metro N-Judah (Runs along the south border of the park)",
      "Muni Bus 5 Fulton (Runs along the north border of the park)",
      "Muni Bus 44 O'Shaughnessy (Cuts north-south through the park museums to BART)"
    ],
    safetyTips: "Very safe by day. Avoid entering the heavily forested, unlit trails alone late at night. Stick to JFK Promenade.",
    secrets: "JFK Promenade is entirely car-free! Rent a tandem bike or rollerblades and glide past free outdoor pianos, art installations, and redwood groves.",
    svgPath: "M 100,380 L 400,380 L 400,430 L 100,430 Z",
    labelX: 250,
    labelY: 405,
    fillColor: "#d2ebd4",
    borderColor: "#1e8e3e",
  },
  {
    id: "haight",
    name: "Haight-Ashbury",
    description: "The world-famous birthplace of the 1967 'Summer of Love' counterculture movement. Filled with colorful Victorian architecture, vintage clothing boutiques, vinyl record stores, and a bohemian attitude.",
    vibe: "Artsy, nostalgic, colorful, eccentric, and alternative. Great people-watching.",
    highlights: [
      "The historic Haight-Ashbury Intersection",
      "Amoeba Music (massive independent record store in former bowling alley)",
      "Buena Vista Park (steep wooded hill with views of the bay)",
      "The Grateful Dead & Jimi Hendrix historic houses"
    ],
    transitConnections: [
      "Muni Bus 7 Haight (Frequent bus directly to Market St & Downtown)",
      "Muni Bus 33 Ashbury (Direct link to Mission District and Castro)",
      "Muni Metro N-Judah (Board at Cole Valley, just 2 blocks south of Haight)"
    ],
    safetyTips: "Fun and safe during the day. Can attract eccentric street youths and transients. Stick to main commercial corridors at night.",
    secrets: "Walk to the top of Buena Vista Park—the trails are lined with recycled marble headstones taken from old SF cemeteries relocated in the early 1900s.",
    svgPath: "M 400,350 L 520,350 L 520,450 L 400,450 Z",
    labelX: 460,
    labelY: 400,
    fillColor: "#fdf2e9",
    borderColor: "#e87114",
  },
  {
    id: "mission",
    name: "Mission District",
    description: "SF's sunniest, warmest, and most vibrant neighborhood. Historically Hispanic, the Mission merges amazing street murals, world-class bakeries, legendary burritos, trendy cocktail lounges, and active community parks.",
    vibe: "Sunny, energetic, cultural, hip, and delicious. High street activity.",
    highlights: [
      "Dolores Park (SF's premier lawn social scene with skyline views)",
      "Clarion Alley & Balmy Alley (mind-blowing murals)",
      "Mission Burritos (La Taqueria, El Farolito, Cancun)",
      "Tartine Bakery & Bi-Rite Creamery"
    ],
    transitConnections: [
      "BART Lines (16th St Mission Station & 24th St Mission Station - 5 mins to Downtown)",
      "Muni Bus 14 / 14R Mission & 49 Van Ness (Extremely frequent rapid corridors)",
      "Muni Metro J-Church (Scenic light rail running right past Dolores Park)"
    ],
    safetyTips: "Generally safe and lively. Some blocks (like near 16th St BART plaza) can feel chaotic. Keep your phone secure and stay aware of your surroundings, especially at night.",
    secrets: "For a local treat, grab a burrito to-go and head to the south-facing slopes of Dolores Park. It's warm, has an incredible skyline view, and is the ultimate people-watching venue.",
    svgPath: "M 580,450 L 720,450 L 720,700 L 580,700 Z",
    labelX: 650,
    labelY: 575,
    fillColor: "#fff0f2",
    borderColor: "#d93025",
  },
  {
    id: "castro",
    name: "Castro & Noe Valley",
    description: "The Castro is the historic international epicenter of LGBTQ+ pride and rights, centered around the stunning Castro Theatre. Noe Valley, just south, is a quiet, sunny, family-oriented valley filled with upscale cafes and clean streets.",
    vibe: "Proud, welcoming, sunny, historic, and tidy. Strong neighborhood community.",
    highlights: [
      "The Castro Theatre & Rainbow Honor Walk",
      "Twin Peaks Overlook (highest point in SF, just west)",
      "Noe Valley's 24th Street shopping corridor",
      "Harvey Milk's former camera shop & historic residence"
    ],
    transitConnections: [
      "Muni Metro - Castro Station (K, L, M, T lines underground to Market St)",
      "Muni Metro J-Church (Runs directly through Noe Valley streets)",
      "F-Market & Wharves (Historic streetcar line starting in Castro and running along Market to Fisherman's Wharf)"
    ],
    safetyTips: "Extremely safe, inclusive, and welcoming neighborhood. Standard urban awareness on weekend nights.",
    secrets: "Twin Peaks can be reached by hiking trails starting in Noe Valley/Castro. It's a steep climb but yields the most iconic view of the entire Bay Area.",
    svgPath: "M 480,450 L 580,450 L 580,680 L 480,680 Z",
    labelX: 530,
    labelY: 565,
    fillColor: "#fff0f7",
    borderColor: "#e52592",
  },
  {
    id: "potrero",
    name: "Potrero Hill & Dogpatch",
    description: "Potrero is a sunny, quiet residential hill offering postcard-perfect views of downtown. Dogpatch, on the waterfront, is a former industrial shipbuilding hub that has evolved into a trendy maker-district with breweries, art galleries, and restaurants.",
    vibe: "Industrial-chic, sunny, architectural, artisanal, and neighborly.",
    highlights: [
      "Dogpatch maker shops (local leather, chocolate, craft beer)",
      "Potrero Hill views (Vermont Street - the actual crookedest street!)",
      "Minnesota Street Project (massive contemporary art warehouse)",
      "Anchor Steam Brewery history site"
    ],
    transitConnections: [
      "Muni Metro T-Third (Sleek surface light-rail direct to Chase Center & Downtown)",
      "Caltrain Station (22nd Street Station - quick access to Peninsula)",
      "Muni Bus 22 Fillmore (Northward through SOMA and Fillmore)"
    ],
    safetyTips: "Very safe residential and industrial corridors. Industrial blocks can feel isolated or dark late at night; stick to Third Street or Potrero's main avenues.",
    secrets: "Vermont Street in Potrero Hill has a series of switchbacks that are actually steeper and tighter than Lombard Street, without any of the tourist crowds.",
    svgPath: "M 720,450 L 900,450 L 900,680 L 720,680 Z",
    labelX: 810,
    labelY: 565,
    fillColor: "#e8f0fe",
    borderColor: "#1a73e8",
  },
  {
    id: "twinpeaks",
    name: "Twin Peaks & Glen Park",
    description: "Located at the geographic center of SF. Twin Peaks features the wind-swept, 922-foot summits with panoramic views of the entire Bay. Glen Park, below, is a charming, village-like enclave with rolling canyons, independent grocers, and quiet streets.",
    vibe: "Scenic, quiet, village-like, hilly, and outdoorsy.",
    highlights: [
      "Twin Peaks Christmas Tree Point overlook",
      "Glen Canyon Park (actual dirt hiking trails, rock climbing walls)",
      "Glen Park Village (quaint bistros, bookshops)",
      "Sutro Tower (the towering iconic red-and-white metal antenna)"
    ],
    transitConnections: [
      "BART - Glen Park Station (Architecturally award-winning station, 7 mins to Downtown)",
      "Muni Metro - Forest Hill Station (SF's oldest operating subway station)",
      "Muni Bus 44 & 36 (Wind up the steep hills to Twin Peaks and canyons)"
    ],
    safetyTips: "Twin Peaks is famous for high wind and heavy fog; carry a jacket even on hot days. Park only in designated parking lots at Twin Peaks and lock your car—break-ins are common there.",
    secrets: "Glen Canyon Park is a true hidden valley. Walk 10 minutes from the Glen Park BART station and you will find yourself surrounded by massive eucalyptus trees, rock climbing formations, and a flowing creek.",
    svgPath: "M 400,520 L 480,520 L 480,720 L 350,720 L 350,600 Z",
    labelX: 415,
    labelY: 620,
    fillColor: "#e6f4ea",
    borderColor: "#137333",
  },
  {
    id: "bayview",
    name: "Bayview & Hunters Point",
    description: "SF's sunniest southeastern corner. Steeped in history as a major industrial shipyard, Bayview has an incredibly strong community soul, filled with local soul food, community gardens, artist warehouses, and public parks.",
    vibe: "Warm, industrial, community-rich, historic, and evolving.",
    highlights: [
      "Heron's Head Park (beautiful wetlands, salt-marsh trail, bird watching)",
      "Hunters Point Shipyard Artist Studios",
      "Bayview Opera House (SF's oldest cultural institution)",
      "The Point / Shipyard sculpture walk"
    ],
    transitConnections: [
      "Muni Metro T-Third (Surface light rail running along Third St corridor directly to Chase Center & Downtown)",
      "Muni Bus 44 O'Shaughnessy (Runs from Bayview across Glen Park and Golden Gate Park)",
      "Muni Bus 9 San Bruno"
    ],
    safetyTips: "Locals are warm and tight-knit. Some pockets are industrial and isolated. Stick to main transit corridors and well-frequented public spaces, especially at night.",
    secrets: "Heron's Head Park features an off-grid EcoCenter that teaches sustainable tech, and is one of the premier spots in SF to watch migratory water birds.",
    svgPath: "M 720,680 L 950,680 L 950,900 L 720,900 Z",
    labelX: 835,
    labelY: 790,
    fillColor: "#fdf2e9",
    borderColor: "#e87114",
  },
  {
    id: "excelsior",
    name: "Excelsior & Balboa Park",
    description: "SF's most southern residential neighborhoods. Highly diverse, working-class family districts. Balboa Park hosts major city education centers like CCSF and massive athletic transit yards.",
    vibe: "Family-oriented, diverse, unpretentious, energetic, and residential.",
    highlights: [
      "McLaren Park (SF's second largest park, home to the Jerry Garcia Amphitheater)",
      "Mission Street Excelsior commercial corridor (incredible international bakeries)",
      "Balboa Park Playground & Swim Center",
      "Philz Coffee original-style shops"
    ],
    transitConnections: [
      "BART - Balboa Park Station (Major transit terminal, connects BART to Muni Metro)",
      "Muni Metro J-Church & M-Ocean View (Both terminate/intersect at Balboa Park)",
      "Muni Bus 14 / 14R Mission & 49 Van Ness (Frequent transit to Downtown)",
      "Quick access to I-280 highway"
    ],
    safetyTips: "Very safe, authentic neighborhood. McLaren Park is huge and beautiful; hike with companions on more secluded wooded paths.",
    secrets: "McLaren Park has a stunning redwood grove (La Grande Redwoods) and an awesome 9-hole golf course that is way less crowded and cheaper than Golden Gate Park's.",
    svgPath: "M 480,680 L 720,680 L 720,920 L 450,920 L 450,720 Z",
    labelX: 585,
    labelY: 800,
    fillColor: "#f1f3f4",
    borderColor: "#5f6368",
  }
];
