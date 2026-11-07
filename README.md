# North Campus Commons — Sparkathon 2026

Interactive 3D concept model of affordable, sustainable, community-centered workforce housing for
Claremont Colleges employees. It sits on the **31.5-acre North Campus golf course parcel**, west edge on
Indian Hill Blvd, built with Three.js.

> *Designed around people, not cars.* Parking and the only vehicle road wrap the edge of the site. The
> interior is reserved for a public park, courtyards, greenways and shared amenities.

## Run it locally (VS Code)

Three.js is already vendored in `vendor/three`, so **no `npm install` is needed** to view the site.

**Option A: Node (recommended)**
1. Open the `Sparkathon` folder in VS Code.
2. Open a terminal (`` Ctrl+` ``) and run:
   ```
   npm start
   ```
3. Open **http://localhost:5173** in Chrome or Edge.

**Option B: Live Server extension**
1. Install the *Live Server* extension (Ritwick Dey).
2. Right-click `index.html` → **Open with Live Server**.

> Opening `index.html` by double-clicking (a `file://` URL) won't work, because browsers block ES modules there. Use one of the options above.

## Using the model

| Control | Action |
|---|---|
| Left-drag / right-drag / scroll | Rotate / pan / zoom |
| **Overview, Community Park, Residential Courtyards, Solar Parking, Community Center** | Fly the camera to that area and highlight it |
| **Street View** | Eye-level views; click again to cycle through the spots. Drag to look around, **W A S D** to walk (Shift = faster) |
| **Sustainability Tour / Community Tour** | Auto-advancing guided tours (◀ ▶ pause, or arrow keys; Esc to exit) |
| Numbered pins / clicking a building, courtyard or carport | Opens the information panel |
| Layers | Feature labels, land-use diagram, 31.5-acre boundary, auto-rotate, shadows |
| Time of day slider | Moves the sun (lighting and shadows) |

The stats bar is calculated from the generated model: acreage, homes, open space, stalls, solar capacity and EV stalls.

## What's in the design

- **Front park (≈5 acres)** on Indian Hill Blvd: event lawn and stage, playground, BBQ pavilion, walking/jogging loop, native meadow, entrance plaza.
- **Commons Center** at the head of the main axis. It has a shared kitchen and hall, co-work/study rooms, a tool library and a park patio. A covered breezeway carries the main path straight through it.
- **Eco-village housing (~500 homes in ~110 small buildings)**: timber-clad 2–3 story buildings with light metal roofs, solar hot-water collectors, pergolas and balconies. They are scattered along curving car-free lanes with private and shared gardens in between (`js/components/village.js`; set the target in `VILLAGE.targetHomes` in `js/layout.js`). 3-story buildings are stacked homes: a ground-floor flat with a 2-story townhome above.
- **Car-free pedestrian network**: the Commons Spine (east–west), a curving north–south greenway, paseos and courtyard passages. Residents walk from home to the park without crossing a street, and the wide paths are fire-lane rated.
- **Perimeter loop road + solar carports**: cantilevered steel canopies with PV modules, painted stalls, accessible stalls, EV chargers and planted islands. They sit only on the outer edge, with crosswalks wherever a path meets the road.
- **Sustainability**: about 1 MW DC of carport PV plus rooftop PV, bioswale rain gardens, a community garden/orchard with composting, and drought-tolerant native landscaping.

Solar numbers are planning-level estimates (400 W modules, ~1,600 kWh/kW-yr) and are subject to feasibility.

## Editing the layout

Everything is driven by **`js/layout.js`**:
- `BOUNDARY`: the parcel outline, traced from the TCCS map and scaled to exactly 31.5 acres
- `CLUSTERS`: position, type (`quad`, `ucourt`, `mews`), open side, courtyard theme, stories and color palette for each cluster
- `PARK`, `COMMUNITY_CENTER`, `GREENWAYS`, `AMENITIES`, `PARKING`, `ROAD`, `STREET_VIEWS`

Text for the info panels and tours is in **`js/features.js`**.

## Code structure

```
index.html, css/styles.css     UI shell
js/main.js                     entry point + render loop
js/layout.js                   site plan configuration (edit me)
js/features.js                 info-panel and tour content
js/world.js                    assembles the neighborhood, features and stats
js/app/scene.js                renderer, sky, sun & shadows, orbit controls
js/app/ui.js                   camera flights, picking, highlights, pins, tours, diagram
js/core/batcher.js             merges thousands of parts into a few draw calls; Draw helper
js/core/materials.js           procedural textures and materials (no image files)
js/core/geo.js                 plan geometry helpers
js/components/buildings.js     townhouseBar(), residentialCluster(), communityCenter(), pavilion()
js/components/parking.js       solarCarport(), car(), buildPerimeter(), traffic
js/components/landscape.js     park, courtyard themes, greenways, garden, rec green
js/components/furniture.js     benches, tables, raised beds, play/fitness gear, people…
js/components/vegetation.js    instanced trees, shrubs and grasses
js/components/context.js       surrounding streets and land uses
references/                    UCI reference photos
tools/check.mjs                automated browser check (screenshots + console errors)
```

## Automated check (optional)

```
npm install          # installs puppeteer-core (uses your installed Edge/Chrome)
npm start            # in one terminal
npm run check        # in another; screenshots are saved to ./screenshots
```
