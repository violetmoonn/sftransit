import { TransitLine, Station } from "../types";

export const transitLines: TransitLine[] = [
  {
    id: "bart-sf",
    name: "BART (Bay Area Rapid Transit)",
    type: "bart",
    color: "#0072ce",
    description: "High-speed regional rail connecting SF to Oakland, Berkeley, SFO Airport, and East/South Bay. Operates underground in SF under Market St and Mission St. Rapid, high-capacity, and best for crossing the bay or traveling from downtown to the Mission.",
    svgPath: "M 950,150 C 900,120 860,100 860,100 L 820,150 L 780,200 L 700,250 L 650,500 L 650,630 L 460,700 L 470,860 L 400,950",
    frequency: "About every 10 minutes on most lines (8–12 on some), 7 days a week.",
    hours: "5:00 AM - Midnight (Mon-Fri), 6:00 AM - Midnight (Sat), 8:00 AM - Midnight (Sun)",
    stations: ["Embarcadero", "Montgomery", "Powell", "Civic Center", "16th St Mission", "24th St Mission", "Glen Park", "Balboa Park"]
  },
  {
    id: "muni-n",
    name: "Muni Metro N-Judah",
    type: "muni-metro",
    color: "#ff0000",
    description: "SF's busiest light-rail line. Connects Downtown and 4th & King to Ocean Beach, running underground in the Market Street Subway, then through the Sunset Tunnel and across the Inner and Outer Sunset. Popular with UCSF students and surfers.",
    svgPath: "M 120,500 L 280,500 L 460,430 C 500,400 530,370 550,350 L 700,250 L 780,200 L 820,150 L 860,100 L 900,280",
    frequency: "About every 10 minutes on weekdays, 12 on weekends.",
    hours: "From 5:00 AM (Mon-Fri), 6:00 AM (Sat), 8:00 AM (Sun) until about 1:00 AM. The N Owl bus runs overnight.",
    stations: ["Ocean Beach", "19th Ave", "Cole Valley", "Duboce Portal", "Civic Center", "Powell", "Montgomery", "Embarcadero", "Caltrain Depot"]
  },
  {
    id: "muni-t",
    name: "Muni Metro T-Third Street",
    type: "muni-metro",
    color: "#ea4335",
    description: "A major north-south line linking Bayview and Dogpatch to Mission Bay (Chase Center), 4th & King (Oracle Park), and then underground through the Central Subway to Yerba Buena, Union Square and Chinatown-Rose Pak. Handy for game days and Chinatown.",
    svgPath: "M 735,100 L 780,180 L 850,400 L 830,580 L 830,780 L 850,910",
    frequency: "About every 10-12 minutes.",
    hours: "From 5:00 AM (Mon-Fri), 6:00 AM (Sat), 8:00 AM (Sun) until about 1:00 AM.",
    stations: ["Chinatown-Rose Pak", "Union Square/Market St", "Yerba Buena/Moscone", "4th & King", "UCSF/Chase Center", "20th St", "23rd St", "Sunnydale"]
  },
  {
    id: "muni-j",
    name: "Muni Metro J-Church",
    type: "muni-metro",
    color: "#fbbc04",
    description: "A scenic, historic light-rail line. Moves from Balboa Park through Glen Park canyon, up the streets of sunny Noe Valley, runs on its own tracks through Dolores Park (with skyline views), and enters the Market St Subway to Downtown.",
    svgPath: "M 470,860 L 530,630 L 550,500 L 570,350 L 700,250 L 780,200 L 820,150 L 860,100",
    frequency: "About every 12-15 minutes.",
    hours: "Early morning until about 1:00 AM. Check sfmta.com for exact times.",
    stations: ["Balboa Park Terminal", "Glen Park Village", "24th St Noe Valley", "Dolores Park", "Church & Duboce", "Civic Center", "Powell", "Embarcadero"]
  },
  {
    id: "caltrain-sf",
    name: "Caltrain Regional Rail",
    type: "caltrain",
    color: "#000000",
    description: "Electric commuter rail (since September 2024) from San Francisco's 4th & King down the Peninsula through San Mateo, Palo Alto (Stanford) and Mountain View to San Jose and Tamien. A few weekday trips continue to Gilroy. Best for Peninsula and South Bay trips.",
    svgPath: "M 900,280 L 880,580 L 860,880 L 830,980",
    frequency: "4 trains an hour each way at weekday peak; every 30 minutes off-peak and on weekends.",
    hours: "Early morning until about midnight. Check caltrain.com for first and last trains.",
    stations: ["Caltrain Depot (4th & King)", "22nd St Potrero", "Bayshore", "Millbrae (SFO Link)", "San Jose Diridon"]
  },
  {
    id: "cable-powell",
    name: "Powell-Hyde / Mason Cable Cars",
    type: "cable-car",
    color: "#0f9d58",
    description: "The world's last manually operated cable car system. The Powell lines start at Market Street, climb Nob Hill, and descend steeply to Fisherman's Wharf and Ghirardelli Square. Known for iconic bell-ringing and hanging on the side rails.",
    svgPath: "M 780,200 L 770,140 L 720,100",
    frequency: "About every 10-15 minutes.",
    hours: "Morning to late evening daily. Check sfmta.com for exact times.",
    stations: ["Powell & Market Turntable", "Union Square", "Nob Hill (California St Crossing)", "Hyde & Lombard (Crooked Street)", "Aquatic Park Turntable (Hyde)"]
  },
  {
    id: "cable-california",
    name: "California Street Cable Car",
    type: "cable-car",
    color: "#137333",
    description: "A less crowded cable car line running east-west along California Street from Market Street, over Nob Hill, to Van Ness Avenue. Good for a classic hill climb without the Powell Street lines.",
    svgPath: "M 860,100 L 770,140 L 560,140",
    frequency: "About every 12-15 minutes.",
    hours: "7:00 AM - 9:00 PM Daily.",
    stations: ["California & Market", "Grant Ave (Chinatown)", "Powell St (Nob Hill)", "Polk St", "Van Ness Ave"]
  }
];

export const stations: Station[] = [
  { id: "s-embarcadero", name: "Embarcadero", x: 860, y: 100, lines: ["BART", "Muni Metro (All)"], type: "hub", description: "Primary hub for Ferry connections, Financial District, and F-Market historic streetcars." },
  { id: "s-montgomery", name: "Montgomery", x: 820, y: 150, lines: ["BART", "Muni Metro (All)"], type: "hub", description: "Bustling downtown commercial terminal serving skyscrapers and Salesforce Transit Center." },
  { id: "s-powell", name: "Powell", x: 780, y: 200, lines: ["BART", "Muni Metro (All)", "Cable Cars"], type: "hub", description: "Union Square shopping gateway, historic cable car turntable, and busy tourist crossing." },
  { id: "s-civic-center", name: "Civic Center", x: 700, y: 250, lines: ["BART", "Muni Metro (All)"], type: "hub", description: "Serving City Hall, Asian Art Museum, SF Symphony, and Main Public Library." },
  { id: "s-16th-mission", name: "16th St Mission", x: 650, y: 500, lines: ["BART"], type: "bart", description: "Gateway to the trendy North Mission shops, murals, restaurants, and Dolores Park." },
  { id: "s-24th-mission", name: "24th St Mission", x: 650, y: 630, lines: ["BART"], type: "bart", description: "Vibrant cultural center of the Mission's Latino community, murals, and bakeries." },
  { id: "s-glen-park", name: "Glen Park", x: 460, y: 700, lines: ["BART", "Muni Metro J"], type: "hub", description: "Quaint village station linking regional BART to Muni Metro J and canyon trails." },
  { id: "s-balboa-park", name: "Balboa Park", x: 470, y: 860, lines: ["BART", "Muni Metro J", "Muni Metro M"], type: "hub", description: "Southern transit hub next to City College, where the J and M lines end." },
  { id: "s-caltrain-4th", name: "Caltrain Depot (4th & King)", x: 900, y: 280, lines: ["Caltrain", "Muni Metro N", "Muni Metro T"], type: "hub", description: "Major heavy-rail terminal for Silicon Valley trains, Oracle Park, and South SOMA." },
  { id: "s-22nd-dogpatch", name: "22nd St (Caltrain)", x: 880, y: 580, lines: ["Caltrain"], type: "caltrain", description: "Caltrain station in a cut below Potrero Hill, a short walk from the T line's 20th St and 23rd St stops in Dogpatch." },
  { id: "s-chinatown-rose", name: "Chinatown-Rose Pak", x: 735, y: 100, lines: ["Muni Metro T"], type: "muni-metro", description: "Central Subway station (opened late 2022) in the heart of Chinatown." },
  { id: "s-chase-center", name: "UCSF/Chase Center", x: 850, y: 400, lines: ["Muni Metro T"], type: "muni-metro", description: "Serving the Golden State Warriors arena, hospital campus, and waterfront parks." },
];
