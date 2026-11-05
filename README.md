# Marigold

Visibility over Chhattisgarh's mineral supply chains, for stakeholders in large, complex supply chains: what's here now, what could be built and the key considerations, from the ground towards deep tech.

By [Prismatic Labs](https://prismaticlabs.ai).

Named for *chandaini gonda*, the French marigold, listed in reference works as Chhattisgarh's state flower. We found no government notification, and some lists name other flowers.

## What it shows

- **Chhattisgarh could turn its minerals into deep tech.** One picture of six mineral chains, with a switch for Here now, Could be built and Key considerations. All six are mined here, five become a local product, and we found none going further. One plant is announced. "Not found" never means "none". Click a row for the detail and sources.
- **Where it is, and what it becomes:** the districts the Indian Bureau of Mines names for each mineral, and what each can become. These are general industry links. They do not trace Chhattisgarh's ore to any plant or buyer.
- **Four considerations across all six chains,** other minerals to watch, recent auction results, and what the page cannot tell you.

## How the data was made

`data/supply.json`, `data/flow.json`, `data/minerals.json`, `data/districts.json`: every fact and link names a source in `data/sources.json`.

Missing is never zero. Everything that does not add up is listed on the Sources page.

## Development

```sh
npm install
npm run dev     # http://localhost:4321/marigold/
npm test        # data links, headline figures, sources, no em dashes
npm run check   # type check
npm run build
```

Pushing to `main` deploys to GitHub Pages.

## Known limits of v0

- Nobody with local industry knowledge has reviewed the "not found" cells yet.
- The status of the Nava Raipur chip plant and AI park, and the news sources, age quickly. Last checked 5 November 2026.

## Licence

Code: MIT. District boundaries: geoBoundaries, ODbL 1.0. Source documents remain with their publishers.
