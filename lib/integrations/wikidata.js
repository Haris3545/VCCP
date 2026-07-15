// Wikidata — keyless structured facts (birth date, awards, official
// discography count, genres) via wbsearchentities + SPARQL.
// Docs: https://www.wikidata.org/wiki/Wikidata:Data_access
import { fetchJson, memoize, live, unavailable } from './http';
import { artistIdentifiers } from '../artist.identifiers';
import { STUDIO_NAME } from '../constants';

const USER_AGENT = `${STUDIO_NAME.replace(/\s+/g, '')}/1.0 ( ${process.env.WIKIDATA_CONTACT || 'no-contact-configured@example.com'} )`;

async function resolveQid() {
  if (artistIdentifiers.wikidataQid) return artistIdentifiers.wikidataQid;
  return memoize('wikidata:qid', 24 * 60 * 60 * 1000, async () => {
    const url = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(
      artistIdentifiers.name
    )}&language=en&format=json&type=item&limit=5`;
    const data = await fetchJson(url, { headers: { 'User-Agent': USER_AGENT } });
    const best = data.search?.[0];
    if (!best) throw new Error('no Wikidata entity match');
    return best.id;
  });
}

const SPARQL_ENDPOINT = 'https://query.wikidata.org/sparql';

function buildQuery(qid) {
  return `
    SELECT ?birthDate ?officialWebsite
      (GROUP_CONCAT(DISTINCT ?awardLabel; separator="|") AS ?awards)
      (GROUP_CONCAT(DISTINCT ?genreLabel; separator="|") AS ?genres)
    WHERE {
      OPTIONAL { wd:${qid} wdt:P569 ?birthDate. }
      OPTIONAL { wd:${qid} wdt:P856 ?officialWebsite. }
      OPTIONAL {
        wd:${qid} wdt:P166 ?award.
        ?award rdfs:label ?awardLabel.
        FILTER(LANG(?awardLabel) = "en")
      }
      OPTIONAL {
        wd:${qid} wdt:P136 ?genre.
        ?genre rdfs:label ?genreLabel.
        FILTER(LANG(?genreLabel) = "en")
      }
    }
    GROUP BY ?birthDate ?officialWebsite
    LIMIT 1
  `;
}

export async function getFacts() {
  try {
    const qid = await resolveQid();
    return await memoize(`wikidata:facts:${qid}`, 6 * 60 * 60 * 1000, async () => {
      const url = `${SPARQL_ENDPOINT}?query=${encodeURIComponent(buildQuery(qid))}&format=json`;
      const data = await fetchJson(url, {
        headers: { 'User-Agent': USER_AGENT, Accept: 'application/sparql-results+json' },
      });
      const row = data.results?.bindings?.[0] || {};
      return live({
        qid,
        birthDate: row.birthDate?.value || null,
        officialWebsite: row.officialWebsite?.value || null,
        awards: row.awards?.value ? row.awards.value.split('|') : [],
        genres: row.genres?.value ? row.genres.value.split('|') : [],
      });
    });
  } catch (err) {
    return unavailable(`Wikidata fetch failed: ${err.message}`);
  }
}
