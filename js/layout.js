// ============================================================================================
//  SITE PLAN CONFIGURATION — edit this file to rearrange the neighborhood.
//  Units: meters. Plan coordinates [x, z]: +x = east, +z = south (north is -z). Origin = site center.
// ============================================================================================

/**
 * Golf-course parcel boundary, traced from the TCCS North Campus map and scaled so its area is
 * exactly 31.5 acres (127,476 m²). West edge = Indian Hill Blvd frontage.
 */
export const BOUNDARY = [
  [-182.28, -113.68], [-55.86, -113.68], [-4.9, -198.94], [182.28, -198.94], [182.28, 173.46], [1.96, 173.46], [-13.72, 199.92], [-182.28, 199.92],
];
export const SITE_ACRES = 31.5;

/** Perimeter loop road: a "U" that wraps the north, east and south edges. The west (park) side has no road. */
export const ROAD = {
  centerOffset: 12.75, // meters inside the property line
  width: 7.5,
  sidewalk: 2.0,
  entranceX: -190,      // where the two entrance drives meet Indian Hill Blvd
  indianHillX: -197,
};

/** Covered solar carports along the OUTER side of the loop road. */
export const PARKING = {
  stallWidth: 2.7,
  stallDepth: 5.5,
  stallsPerCanopy: 8,
  canopyGap: 5.5,         // landscape island between canopies
  occupancy: 0.68,        // share of stalls shown with parked cars
  evEvery: 4,             // every Nth canopy gets EV chargers
  panelWatts: 400,
  annualKWhPerKW: 1600,   // planning-level Southern California yield
};

/** Large public park at the front (Indian Hill Blvd) entrance. */
export const PARK = {
  bounds: { x0: -179, x1: -91, z0: -92, z1: 179 },
  axisZ: 34,                                        // main pedestrian axis: park -> community center -> spine
  eventLawn: { x: -143, z: -30, rx: 26, rz: 40 },
  stage: { x: -143, z: -78 },
  playground: { x: -151, z: 75, w: 30, d: 22 },
  pavilion: { x: -146, z: 130 },
  plaza: { x: -171, z: 34 },
  meadow: { x0: -170, x1: -104, z0: 153, z1: 177 },
  // jogging loop control points (smoothed)
  loop: [[-166, -84], [-120, -87], [-100, -64], [-100, -10], [-131, 4], [-132, 54], [-102, 66], [-100, 148], [-118, 172], [-162, 172], [-169, 120], [-169, 0]],
};

/** Shared community center at the head of the main axis, between park and homes. */
export const COMMUNITY_CENTER = { x: -97, z: 34 };

/**
 * Residential clusters. Each cluster groups townhomes around its own shared courtyard.
 *  type:  'quad'  = 4 buildings around a courtyard
 *         'ucourt'= 3 buildings, one side open (open: 'n'|'s'|'e'|'w') toward a greenway
 *         'mews'  = 2 facing buildings across a green mews (bars run east-west)
 *  theme: courtyard program — 'social' | 'garden' | 'recreation' | 'relax'
 *  stories: per building side {n,s,e,w}; palette: index into PALETTES (buildings.js)
 */
export const CLUSTERS = [
  { id: 'A1', x: -56, z: -60, type: 'quad', theme: 'social', stories: { n: 2, s: 3, e: 2, w: 2 }, palette: 0 },
  { id: 'A2', x: -56, z: 71.5, type: 'ucourt', open: 'n', theme: 'relax', stories: { s: 2, e: 2, w: 2 }, palette: 3 },
  { id: 'A3', x: -56, z: 140, type: 'ucourt', open: 'w', theme: 'garden', stories: { n: 2, s: 2, e: 3 }, palette: 1 },
  { id: 'B1', x: 32, z: -74.5, type: 'ucourt', open: 'e', theme: 'recreation', stories: { n: 2, s: 3, w: 2 }, palette: 4 },
  { id: 'B2', x: 32, z: -3.5, type: 'ucourt', open: 's', theme: 'social', stories: { n: 3, e: 2, w: 2 }, palette: 2 },
  { id: 'B3', x: 32, z: 71.5, type: 'ucourt', open: 'n', theme: 'garden', stories: { s: 2, e: 2, w: 2 }, palette: 5 },
  { id: 'B4', x: 32, z: 135, type: 'mews', theme: 'relax', stories: { n: 2, s: 2 }, palette: 0 },
  { id: 'C1', x: 128, z: -145.5, type: 'ucourt', open: 'w', theme: 'garden', stories: { n: 2, s: 2, e: 2 }, palette: 2 },
  { id: 'C2', x: 128, z: -74.5, type: 'quad', theme: 'relax', stories: { n: 2, s: 2, e: 2, w: 2 }, palette: 1 },
  { id: 'C3', x: 128, z: -3.5, type: 'ucourt', open: 's', theme: 'recreation', stories: { n: 3, e: 2, w: 2 }, palette: 3 },
  { id: 'C4', x: 128, z: 71.5, type: 'quad', theme: 'social', stories: { n: 2, s: 2, e: 2, w: 2 }, palette: 4 },
  { id: 'C5', x: 128, z: 135, type: 'mews', theme: 'recreation', stories: { n: 2, s: 2 }, palette: 5 },
];

/** Cluster geometry (shared by all clusters). */
export const CLUSTER_DIMS = {
  longUnits: 7, longUnitWidth: 6.4,   // north/south buildings
  shortUnits: 3, shortUnitWidth: 5.6, // east/west buildings
  depth: 10, courtX: 17, courtZ: 13,  // courtyard half-sizes (inner faces of buildings)
  mewsHalf: 6, yard: 2.5,
};

/** Car-free pedestrian network. All interior paths double as accessible routes; wide ones are fire-lane rated. */
export const GREENWAYS = {
  spine: { z: 34, x0: -81, x1: 163, width: 24, path: 5 },                     // east-west "Commons Spine"
  greenway: { x: 80, ctrl: [[80, -180], [75, -125], [85, -60], [80, 0], [80, 34], [75, 90], [84, 128], [80, 155]], width: 34, path: 4 },
  plaza: { x: 80, z: 34, r: 9 },
  paths: [
    { pts: [[-12, -150], [-12, 182]], w: 3 },          // west paseo
    { pts: [[-91, -93], [-91, 18]], w: 2.5 },          // park edge walk (north)
    { pts: [[-91, 50], [-91, 180]], w: 2.5 },          // park edge walk (south)
    { pts: [[-12, -110], [164, -110]], w: 2.5 },
    { pts: [[-12, -39], [164, -39]], w: 2.5 },
    { pts: [[-91, 106], [164, 106]], w: 2.5 },
    { pts: [[-12, -150], [-12, -168], [8, -180]], w: 2.5 },
  ],
  /** x positions of north-south walks that cluster passages connect to (sidewalk at east edge). */
  collectors: [-91, -12, 80, 164.5],
};

/** Shared amenity zones outside the clusters. */
export const AMENITIES = {
  recGreen: { x: -56, z: -6, w: 56, d: 52 },          // Recreation Green (courtyard C, large)
  northGarden: { x: 36, z: -146, w: 50, d: 46 },      // Community garden + orchard + compost
};

/** Eco-village housing (see components/village.js). */
export const VILLAGE = {
  targetHomes: 500,
  // neighborhood street through part of the homes: from the east loop road to the south loop road
  roads: [[[169.5, -54], [120, -55], [62, -50], [32, -30], [22, 20], [26, 80], [30, 130], [30, 160.7]]],
  // two pocket parks among the homes
  parks: [{ id: 'pocket-1', x: 95, z: -15, w: 44, d: 40 }, { id: 'pocket-2', x: -30, z: 110, w: 40, d: 36 }],
};

/** Street-level viewpoints for the "Street View" button. */
export const STREET_VIEWS = [
  { name: 'Park entrance plaza', pos: [-179, 1.7, 41], target: [-150, 2.5, 34] },
  { name: 'Commons Spine promenade', pos: [-60, 1.7, 31], target: [-20, 3, 34] },
  { name: 'Inside a residential courtyard', pos: [114.4, 1.7, 73.8], target: [140, 3.2, 69] },
  { name: 'Under the solar carports', pos: [175.6, 1.7, -14], target: [176.4, 2.4, -40] },
  { name: 'North–south greenway', pos: [82, 1.7, -75], target: [80, 2.5, -40] },
];
