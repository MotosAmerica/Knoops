// Knoops Academy — store list for the sign-in dropdown
// Sourced from knoops.com/pages/store-locations (UK/UAE) and public coverage
// of the Salt Lake City opening (US) — see claude/knoops-academy-outlines.md
// for sourcing notes. This is a plain JS list, not a database constraint, on
// purpose: a new store opening shouldn't require a schema migration, just an
// addition to this array. If a store isn't listed yet, "Other / not listed"
// still lets someone sign in and type their store name.
window.KNOOPS_STORES = [
  // United Kingdom
  "Bath", "Belfast", "Brighton", "Cambridge", "Cardiff", "Chelsea (London)",
  "Chester", "Colchester", "Covent Garden (London)", "Edinburgh New Town",
  "Edinburgh Old Town", "Exeter", "Guildford", "Kensington (London)",
  "Knightsbridge (London)", "Leeds", "Manchester", "Newcastle", "Norwich",
  "Notting Hill (London)", "Nottingham", "Oxford", "Richmond", "Rye",
  "St Albans", "York",
  // United Arab Emirates
  "Mirdif Mall (Dubai)", "Meydan (Dubai)", "Yas Mall (Abu Dhabi)",
  // United States
  "Salt Lake City (9th & 9th)",
  // Non-store / corporate
  "Knoops Corporate / HQ",
  "Other / not listed",
];
