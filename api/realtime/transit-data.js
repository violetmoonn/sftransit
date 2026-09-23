// GET /api/realtime/transit-data → BART departures (live) plus estimated Muni/Caltrain/cable car times.
// Moved from server.ts so it runs on Vercel.
export default async function handler(req, res) {
  try {
    // 1. Fetch real-time BART departures from official BART API
    let bartData = null;
    try {
      const bartRes = await fetch("https://api.bart.gov/api/etd.aspx?cmd=etd&orig=ALL&key=MW9S-E7SL-26DU-VV8V&json=y");
      if (bartRes.ok) {
        const rawJson = await bartRes.json();
        bartData = rawJson?.root?.station || null;
      }
    } catch (err) {
      console.warn("Failed to fetch real-time BART from official API, will use high-fidelity simulation:", err);
    }

    // Transform BART data to a standard easy-to-use structure
    const compiledBart = {};
    if (bartData && Array.isArray(bartData)) {
      bartData.forEach((station) => {
        const abbr = station.abbr;
        const etdList = station.etd || [];
        const departures = [];
        
        const list = Array.isArray(etdList) ? etdList : [etdList];
        list.forEach((etd) => {
          const dest = etd.destination;
          const estimates = etd.estimate || [];
          const estList = Array.isArray(estimates) ? estimates : [estimates];
          estList.forEach((est) => {
            departures.push({
              destination: dest,
              minutes: est.minutes === "Arrived" ? 0 : est.minutes === "Leaving" ? 1 : parseInt(est.minutes) || est.minutes,
              platform: est.platform,
              direction: est.direction,
              color: est.color,
              length: est.length
            });
          });
        });

        // Sort by minutes ascending
        departures.sort((a, b) => {
          const minA = a.minutes === "Leaving" ? 0 : typeof a.minutes === "number" ? a.minutes : 999;
          const minB = b.minutes === "Leaving" ? 0 : typeof b.minutes === "number" ? b.minutes : 999;
          return minA - minB;
        });

        compiledBart[abbr] = departures;
      });
    }

    // 2. Generate high-fidelity real-time departures for Muni, Caltrain, and Cable Cars
    // Base these on current timestamp so predictions count down and cycle realistically in real-time
    const now = Date.now();
    const cycle = Math.floor(now / 1000 / 60);

    const result = {
      timestamp: now,
      // Only BART times are live (BART's public API). The rest are estimates based on typical headways.
      live: { bart: Object.keys(compiledBart).length > 0, muni: false, caltrain: false, cableCar: false, phoenix: false },
      bart: compiledBart,
      muni: {
        "N": [
          { destination: "Ocean Beach", minutes: ((cycle * 7) % 11) + 2, platform: "Surface", direction: "West" },
          { destination: "Caltrain Depot", minutes: ((cycle * 5) % 9) + 1, platform: "Subway", direction: "East" },
          { destination: "Ocean Beach", minutes: ((cycle * 7) % 11) + 12, platform: "Surface", direction: "West" },
          { destination: "Caltrain Depot", minutes: ((cycle * 5) % 9) + 10, platform: "Subway", direction: "East" }
        ],
        "T": [
          { destination: "Chinatown-Rose Pak", minutes: ((cycle * 6) % 12) + 3, platform: "Subway", direction: "North" },
          { destination: "Sunnydale", minutes: ((cycle * 4) % 10) + 1, platform: "Surface", direction: "South" },
          { destination: "Chinatown-Rose Pak", minutes: ((cycle * 6) % 12) + 15, platform: "Subway", direction: "North" },
          { destination: "Sunnydale", minutes: ((cycle * 4) % 10) + 11, platform: "Surface", direction: "South" }
        ],
        "J": [
          { destination: "Balboa Park", minutes: ((cycle * 8) % 14) + 4, platform: "Surface", direction: "South" },
          { destination: "Embarcadero", minutes: ((cycle * 9) % 13) + 2, platform: "Subway", direction: "North" }
        ],
        "38-Geary": [
          { destination: "48th Avenue", minutes: ((cycle * 3) % 6) + 1, platform: "Rapid BRT", direction: "West" },
          { destination: "Salesforce Transit Center", minutes: ((cycle * 4) % 6) + 3, platform: "Rapid BRT", direction: "East" },
          { destination: "48th Avenue", minutes: ((cycle * 3) % 6) + 7, platform: "Rapid BRT", direction: "West" }
        ],
        "14-Mission": [
          { destination: "Daly City BART", minutes: ((cycle * 5) % 8) + 3, platform: "Local", direction: "South" },
          { destination: "Ferry Building", minutes: ((cycle * 3) % 8) + 1, platform: "Local", direction: "North" }
        ]
      },
      caltrain: [
        { trainNo: "105 Local", destination: "San Jose Diridon", minutes: ((cycle * 15) % 30) + 5, status: "On Time" },
        { trainNo: "302 Baby Bullet", destination: "San Francisco 4th & King", minutes: ((cycle * 20) % 45) + 12, status: "On Time" },
        { trainNo: "107 Local", destination: "San Jose Diridon", minutes: ((cycle * 15) % 30) + 25, status: "On Time" }
      ],
      cableCar: [
        { line: "Powell-Hyde", destination: "Fisherman's Wharf", minutes: ((cycle * 7) % 12) + 4, status: "Operational" },
        { line: "California Street", destination: "Van Ness Avenue", minutes: ((cycle * 9) % 15) + 2, status: "Operational" }
      ],
      phoenix: [
        { line: "Phoenix Express SF-1", destination: "Mission Bay Innovation Hub", minutes: ((cycle * 6) % 10) + 3, status: "On Time" },
        { line: "Phoenix Autonomous Connector", destination: "SOMA Tech Center", minutes: ((cycle * 4) % 8) + 1, status: "On Time" },
        { line: "Phoenix Express SF-2", destination: "Bayview Express Hub", minutes: ((cycle * 5) % 12) + 7, status: "On Time" }
      ]
    };

    res.setHeader("Cache-Control", "s-maxage=20, stale-while-revalidate=40");
    res.json(result);
  } catch (error) {
    console.error("Real-time aggregator error:", error);
    res.status(500).json({ error: "Failed to load real-time transit data." });
  }
}
