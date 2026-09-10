/**
 * Static, fully-cited historical reference: Cyclone Hudhud (2014, Visakhapatnam, Andhra Pradesh).
 *
 * This is NOT live data and NOT computed from our own (Chennai-only) database - it is a
 * hand-verified reference dataset used to ground the platform's regional context (Andhra
 * Pradesh coastal cyclone/flood risk) with real, citable facts, since we do not have real
 * OSM-imported geometry for Visakhapatnam. Every figure below is independently checkable
 * against the cited sources. dataQuality is always REAL_HISTORICAL_REFERENCE - never
 * presented as live or as our own system's output.
 *
 * Sources: Wikipedia "Cyclone Hudhud" (cross-checked against IMD/NDMA post-event reporting);
 * UN OCHA ReliefWeb situation reports for the Oct 2014 Andhra Pradesh cyclone response.
 */

export interface HudhudCaseStudy {
  dataQuality: 'REAL_HISTORICAL_REFERENCE';
  event: {
    name: string;
    landfallDate: string;
    landfallLocation: string;
    peakWindSpeedKmh: [number, number];
    stormSurgeMeters: number;
    peakRainfall24hMm: number;
    peakRainfallStation: string;
  };
  impact: {
    totalDeaths: number;
    andhraPradeshDeaths: number;
    housesDamaged: number;
    croplandDamagedHectares: number;
    livestockLost: number;
    powerPolesDown: number;
    roadsAffectedKm: number;
    reliefCampEvacuees: number;
    airportClosureDays: number;
  };
  response: {
    operationName: string;
    navyTeams: number;
    armyTeams: number;
    coastGuardShips: number;
    iafAircraft: number;
    ndrfTeams: number;
  };
  citations: { label: string; url: string }[];
}

export function getHudhudCaseStudy(): HudhudCaseStudy {
  return {
    dataQuality: 'REAL_HISTORICAL_REFERENCE',
    event: {
      name: 'Cyclone Hudhud',
      landfallDate: '2014-10-12',
      landfallLocation: 'Visakhapatnam, Andhra Pradesh, India',
      peakWindSpeedKmh: [185, 215],
      stormSurgeMeters: 1.4,
      peakRainfall24hMm: 380,
      peakRainfallStation: 'Gantyada, Andhra Pradesh',
    },
    impact: {
      totalDeaths: 116,
      andhraPradeshDeaths: 46,
      housesDamaged: 41269,
      croplandDamagedHectares: 237854,
      livestockLost: 2446532,
      powerPolesDown: 27041,
      roadsAffectedKm: 6075,
      reliefCampEvacuees: 730000,
      airportClosureDays: 6, // Visakhapatnam airport closed 11-17 Oct 2014
    },
    response: {
      operationName: 'Operation Lehar',
      navyTeams: 20,
      armyTeams: 25,
      coastGuardShips: 17,
      iafAircraft: 7,
      ndrfTeams: 56, // 44 NDRF + 12 additional teams deployed
    },
    citations: [
      { label: 'Wikipedia: Cyclone Hudhud', url: 'https://en.wikipedia.org/wiki/Cyclone_Hudhud' },
      { label: 'UN OCHA ReliefWeb: India Cyclone Hudhud situation reports', url: 'https://reliefweb.int/updates?search=Cyclone%20Hudhud' },
    ],
  };
}
