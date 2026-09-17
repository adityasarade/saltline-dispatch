// The small ads.
//
// Cala Verda's back page: the businesses that buy two column inches at 2 AM
// because nobody reads the small ads except the people they are addressed to.
// This is where Saltline does its satire - the boom-town register of a coast
// where every legitimate service is also a service, and the paper takes the
// money either way.
//
// Every business, street and body named here is invented for this project.
// Nothing is borrowed from any real company or any game franchise, and
// scripts/check-content.mjs fails the build if a franchise or real-brand
// token ever turns up in this file or in the case copy.
//
// Some of these names already appear in lib/assignments.ts as the fronts the
// night's cases run through. That is deliberate: the paper is selling ad
// space to the people it is investigating, which is the joke and also the
// premise.

export type Classified = {
  /** The advertiser, as it would be set in caps on the back page. */
  name: string;
  /** The copy they paid for. */
  copy: string;
  /** The rate-card line the desk files it under. */
  rate: string;
};

export const CLASSIFIEDS: Classified[] = [
  {
    name: 'Nacre Bay Boat Club',
    copy: 'Memberships available. Moorings, fuel, and a lane of open water at any hour. Discretion included.',
    rate: 'STANDING ORDER / PAID TWELVE MONTHS AHEAD',
  },
  {
    name: 'Paradise Slabs Motor Court',
    copy: 'Hourly, nightly, indefinitely. Rear row has its own gate and no balcony light. Ask at the window, not the desk.',
    rate: 'WEEKLY / SETTLED IN CASH',
  },
  {
    name: 'Vesper Quay Self-Store',
    copy: 'Twenty-four hour access, no inventory questions, no cameras past the second row. Units flooded above the waterline are let at a discount.',
    rate: 'NIGHTLY / NO INVOICE ISSUED',
  },
  {
    name: 'Northbelt Causeway Recovery',
    copy: 'Your vehicle has already been recovered. Call the number below to discuss its return, its plates, and what it was carrying.',
    rate: 'PER COLUMN INCH / PAID BY A THIRD PARTY',
  },
  {
    name: 'Morrow Court Notary',
    copy: 'Open 02:00 to 05:00. Signatures witnessed. Memories not. Two forms of identification accepted, neither of them checked.',
    rate: 'STANDING ORDER / RENEWED WITHOUT COMMENT',
  },
  {
    name: 'Cormorant Carnival Lost Property',
    copy: 'This office is now permanently closed. Nothing was ever handed in. Anyone claiming otherwise is describing a different carnival.',
    rate: 'ONE NIGHT ONLY / PAID AT THE COUNTER',
  },
  {
    name: 'Salt & Sons Laundry',
    copy: 'Same-day service on anything that fits in the drum. We do not ask what the stain was. Uniforms, awnings, upholstery, sails.',
    rate: 'WEEKLY / TRADE RATE',
  },
  {
    name: 'Bellwether Pier Valet',
    copy: 'We park anything that floats. Plates and pennants removed on request and returned on production of this advertisement.',
    rate: 'NIGHTLY / BILLED TO THE CLUB',
  },
  {
    name: 'Cala Cielo Currency Desk',
    copy: 'No identification, no ceiling, no receipt unless you insist. Ferry-side window open while the last boat is still lit.',
    rate: 'STANDING ORDER / PAID IN THE SAME CURRENCY',
  },
  {
    name: 'Office of the Harbourmaster',
    copy: 'Tonight’s log is unavailable. Tomorrow’s log is also unavailable. Enquiries regarding the log should be submitted in writing to the log.',
    rate: 'PUBLIC NOTICE / UNPAID, PRINTED ANYWAY',
  },
];

/**
 * Two ads for a given position on the wall, chosen without a clock so the
 * same wall always carries the same back page. `seed` is the number of plates
 * on the wall, so the ads turn over as the night goes on.
 */
export function classifiedsFor(seed: number, count = 3): Classified[] {
  const total = CLASSIFIEDS.length;
  const safe = Number.isFinite(seed) ? Math.abs(Math.floor(seed)) : 0;
  const size = Math.max(0, Math.min(count, total));
  const out: Classified[] = [];
  for (let index = 0; index < size; index += 1) {
    out.push(CLASSIFIEDS[(safe * 2 + index) % total]);
  }
  return out;
}
