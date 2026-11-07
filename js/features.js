// Text shown in the information panel and the guided tours. Edit freely.
// `view` = camera offset [dx, dy, dz] from the feature's center (meters).

export const CATEGORIES = {
  park: { label: 'Public Park', color: '#3d8b4f' },
  community: { label: 'Shared Amenity', color: '#d9822b' },
  courtyard: { label: 'Courtyard', color: '#6aa84f' },
  solar: { label: 'Solar Parking', color: '#2f6fd1' },
  homes: { label: 'Homes', color: '#b5653f' },
  mobility: { label: 'Walkability', color: '#c9a227' },
  sustain: { label: 'Sustainability', color: '#2e9c8f' },
};

export const INFO = {
  park: {
    title: 'North Campus Commons Park', cat: 'park', view: [-150, 110, 120],
    text: 'A 5+ acre public park forms the front door of the neighborhood along Indian Hill Blvd. It is open to the wider Claremont community, so the new housing gives something back to its neighbors from day one.',
    facts: ['Soccer field on the event lawn, playground, basketball courts, community pool and walking loop', 'Reachable from every home without crossing a street', 'Mature oaks and sycamores for summer shade'],
  },
  'event-lawn': {
    title: 'Event Lawn & Stage', cat: 'park', view: [-55, 40, 60],
    text: 'An open lawn for movie nights, farmers markets, college staff picnics and neighborhood celebrations, ringed by string lights and shaded benches.',
    facts: ['Covered performance stage at the north end', '~1 acre of flexible open space', 'Ringed by a 900 m walking & jogging loop'],
  },
  playground: {
    title: "Children's Playground", cat: 'park', view: [-30, 24, 34],
    text: 'Shaded play structures, swings and spring riders on soft surfacing — placed beside the community center so parents can socialize while kids play.',
    facts: ['Fabric shade sails over play equipment', 'Benches facing the play area', 'Next to restrooms in the community center'],
  },
  pavilion: {
    title: 'Picnic Pavilion & Community BBQ', cat: 'park', view: [-34, 22, 30],
    text: 'An open-air pavilion with picnic tables and a shared grill counter for birthday parties, staff gatherings and weekend cookouts. Its south roof slope carries solar panels.',
    facts: ['Reservable through the community center', 'Shared grills = no private equipment needed', 'Rooftop PV on the south slope'],
  },
  plaza: {
    title: 'Entrance Plaza on Indian Hill Blvd', cat: 'mobility', view: [-36, 20, 26],
    text: 'The public front door. A fountain plaza, bike parking and a monument wall welcome residents and visitors and line up with the main pedestrian axis toward the community center.',
    facts: ['Direct connection to the Indian Hill sidewalk and bus stops', 'Secure bike parking', 'Main axis continues ~250 m through the neighborhood'],
  },
  pool: {
    title: 'Community Pool', cat: 'park', view: [-36, 26, 36],
    text: 'A shared neighborhood pool with a 25 m lap pool, a shallow wading pool for kids, shaded loungers and a pool house with changing rooms and rooftop solar.',
    facts: ['6-lane, 25 m lap pool', 'Wading pool for young children', 'Pool house with rooftop solar for water heating support'],
  },
  soccer: {
    title: 'Soccer Field', cat: 'park', view: [-55, 40, 50],
    text: 'A natural-turf soccer field in the middle of the event lawn — youth leagues and pickup games on weekdays, and it doubles as the audience lawn for stage events.',
    facts: ['32 × 54 m small-sided field with goals', 'Faces the covered stage at the north end', 'Shared with the wider Claremont community'],
  },
  courts: {
    title: 'Basketball Courts', cat: 'park', view: [-30, 22, 32],
    text: 'Two outdoor basketball courts next to the children’s playground, so teens and parents are active right beside the younger kids.',
    facts: ['Two half-courts', 'Next to the playground and park loop', 'Lit by park path lighting'],
  },
  'pocket-park': {
    title: 'Neighborhood Pocket Park', cat: 'park', view: [-40, 32, 44],
    text: 'Small parks in the middle of the homes give every resident a green space within a two-minute walk: a gazebo, play equipment, benches and shade trees.',
    facts: ['Gazebo for small gatherings', 'Play structure and swings', 'Ringed by shade trees'],
  },
  'community-center': {
    title: 'Commons Community Center', cat: 'community', view: [-60, 36, 52],
    text: 'Shared resources that make individual homes cheaper and smaller: a community kitchen and gathering hall, co-working and study rooms, and a tool & equipment library. A covered breezeway carries the main path straight through the building.',
    facts: ['Shared kitchen + multipurpose hall', 'Co-work / study space for staff & families', 'Tool library (ladders, carts, garden tools)', 'Shaded patio and pergola facing the park', 'Rooftop solar on the co-work wing'],
  },
  solar: {
    title: 'Solar Parking Canopy', cat: 'solar', view: [60, 30, 46],
    text: 'Covered parking integrates renewable energy generation while keeping vehicles outside the main pedestrian-centered residential areas. Each canopy shades the cars beneath it and carries photovoltaic modules on top.',
    facts: [],
    note: 'Solar energy could help offset electricity demand in common areas (community center, path lighting, EV charging) and potentially reduce long-term operating expenses, subject to structural, utility-interconnection and cost feasibility.',
  },
  'courtyard-social': {
    title: 'Courtyard A · Social Gathering', cat: 'courtyard', view: [-28, 30, 36],
    text: 'Shared green spaces located directly between homes encourage informal social interactions and stronger neighborhood relationships. Front porches open onto shaded tables, a communal pergola and string lights.',
    facts: ['Front doors face the courtyard', 'Umbrella tables + long communal table', 'Private patios remain on the back side of each home'],
  },
  'courtyard-garden': {
    title: 'Courtyard B · Sustainability Garden', cat: 'courtyard', view: [-28, 30, 36],
    text: 'Shared gardening spaces encourage participation, sustainable food-growing practices, and connections between residents.',
    facts: ['Raised vegetable beds', 'Composting station', 'Citrus trees and native pollinator plants', 'Tool shed with rain barrel'],
  },
  'courtyard-recreation': {
    title: 'Courtyard C · Recreation', cat: 'courtyard', view: [-28, 30, 36],
    text: 'Open lawn and small-scale recreation close to home: a bocce court, ping-pong and outdoor fitness stations, all visible from front porches so kids can play near home.',
    facts: ['Bocce court and ping-pong table', 'Outdoor exercise equipment', 'Walking loop around the courtyard'],
  },
  'courtyard-relax': {
    title: 'Courtyard D · Relaxation', cat: 'courtyard', view: [-28, 30, 36],
    text: 'A quieter courtyard with shade trees, a small fountain, benches and a pergola reading nook — calm space for reading, resting and conversation.',
    facts: ['Shade trees and seating', 'Reading pergola with lounge chairs', 'Water-wise planting with boulders and grasses'],
  },
  homes: {
    title: 'Townhome Cluster', cat: 'homes', view: [-45, 35, 50],
    text: 'Small two- and three-story timber buildings of 2–4 attached homes, spread along curving car-free lanes like an eco-village. Light metal roofs carry solar hot-water collectors and skylights; front pergolas and balconies face the shared lane, with private decks and gardens behind.',
    facts: [],
  },
  garden: {
    title: 'Community Garden & Orchard', cat: 'sustain', view: [-40, 34, 46],
    text: 'Allotment beds, a greenhouse, fruit trees and a composting yard on the north edge of the site, next to the California Botanic Garden.',
    facts: ['24 allotment beds + greenhouse', 'Citrus and olive orchard', 'Neighborhood composting yard', 'Pollinator meadow edge'],
  },
  'rec-green': {
    title: 'Recreation Green', cat: 'courtyard', view: [-50, 36, 54],
    text: 'The largest shared courtyard: a half-court, bocce, fitness stations and a running loop, directly next to the community center and the Commons Spine.',
    facts: ['Basketball half-court', 'Fitness stations + bocce', 'Shade trees and benches'],
  },
  spine: {
    title: 'The Commons Spine', cat: 'mobility', view: [-70, 45, 60],
    text: 'A car-free promenade that runs from the park and community center through the heart of the neighborhood. Residents naturally cross paths here on the way to the park, parking and shared amenities.',
    facts: ['Doubles as a fire-access lane', 'Rain-garden bioswales capture stormwater', 'Benches, path lighting and shade trees every 12 m'],
  },
  greenway: {
    title: 'North–South Greenway', cat: 'mobility', view: [-60, 50, 80],
    text: 'A curving greenway links the community garden in the north to the southern homes, crossing the Commons Spine at a shaded plaza around a heritage oak.',
    facts: ['Fire-lane rated 4 m path', 'Meandering bioswale planting', 'Crossroads plaza with seat walls'],
  },
};

export const TOURS = {
  sustainability: {
    title: 'Sustainability Tour',
    stops: [
      { id: 'solar-east', title: 'Solar carports', text: 'Rows of photovoltaic canopies line the outer loop road. Cars stay at the edge, shaded, while the roofs generate clean electricity.', view: null },
      { id: 'solar-ev', title: 'EV charging', text: 'Green-striped stalls with charging pedestals sit under the solar canopies, so residents can charge from on-site renewable energy.', view: [-16, 7, 10] },
      { id: 'community-center', title: 'Rooftop solar + shared resources', text: 'The community center roof carries more PV. Shared kitchens, co-work rooms and a tool library mean fewer duplicated appliances and less driving.', view: [30, 34, -46] },
      { id: 'garden', title: 'Food, compost & pollinators', text: 'Allotment beds, an orchard, a greenhouse and composting turn food scraps into soil and food into community.', view: [-40, 34, 46] },
      { id: 'courtyard-garden-first', title: 'Courtyard gardens', text: 'Smaller sustainability courtyards put raised beds and compost bins a few steps from front doors.', view: [-26, 28, 32] },
      { id: 'spine', title: 'Stormwater rain gardens', text: 'Bioswales along the Commons Spine and greenway slow, clean and infiltrate rainwater instead of piping it away.', view: [-40, 22, 30] },
      { id: 'park-meadow', title: 'Native, drought-tolerant landscape', text: 'Native grasses, sages and boulders replace thirsty golf turf, cutting irrigation demand while supporting local wildlife next to the Bernard Field Station and Botanic Garden.', view: [-40, 26, 40] },
      { id: 'overview', title: 'Walkable by design', text: 'Every home is within a short walk of the park, garden, community center and transit on Indian Hill — fewer car trips, lower household costs.', view: null },
    ],
  },
  community: {
    title: 'Community Tour',
    stops: [
      { id: 'plaza', title: 'A public front door', text: 'The entrance plaza welcomes neighbors from Indian Hill Blvd — the park is shared with the wider community.', view: [-40, 22, 28] },
      { id: 'event-lawn', title: 'Events bring people together', text: 'Movie nights, markets and staff celebrations happen on the event lawn and stage.', view: [-60, 42, 62] },
      { id: 'playground', title: 'Kids play, parents connect', text: 'The playground sits beside the community center and benches — a natural place for families to meet.', view: [-30, 24, 34] },
      { id: 'pavilion', title: 'A pool for everyone', text: 'The community pool gives families a shared place to swim and cool off in summer — no private pools needed.', view: [-36, 26, 36] },
      { id: 'community-center', title: 'The Commons Center', text: 'A shared kitchen, gathering hall, co-work space and tool library. The main path runs straight through its breezeway.', view: [-60, 36, 52] },
      { id: 'spine', title: 'Everyday encounters', text: 'The car-free Commons Spine connects homes, park, parking and amenities — residents cross paths every day.', view: [-70, 45, 60] },
      { id: 'courtyard-social-first', title: 'Front porches on shared courtyards', text: 'Front doors face shared courtyards with tables, pergolas and string lights — neighbors meet on the way home.', view: [-26, 28, 32] },
      { id: 'courtyard-relax-first', title: 'Privacy is preserved', text: 'Quiet courtyards offer calm space, and every home keeps its own fenced back patio and private entrance.', view: [-26, 28, 32] },
      { id: 'rec-green', title: 'Play close to home', text: 'The Recreation Green offers a half-court, bocce and fitness right next to the Commons Spine.', view: [-50, 36, 54] },
      { id: 'overview', title: 'Designed around people, not cars', text: 'Parking wraps the edge; the center is for people. Parks, courtyards and paths — not parking lots — define the neighborhood.', view: null },
    ],
  },
};
