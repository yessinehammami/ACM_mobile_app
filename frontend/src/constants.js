// GitHub raw URL for latest CSV (updated monthly by GitHub Actions)
export const GITHUB_CSV_URL = import.meta.env.VITE_GITHUB_CSV_URL || null;

// Bundled CSV (baked into the APK at build time)
export const BUNDLED_CSV_URL = '/ACM_data.csv';

// UI Constants
export const PAGE_SIZE = 200;

// Filter Columns
export const FILTER_COLUMNS = [
  { key: 'Produit', label: 'Produit' },
  { key: 'Importateur', label: 'Importateur' },
  { key: 'Fournisseur', label: 'Fournisseur' },
  { key: 'Provenance', label: 'Provenance' },
  { key: 'N° Lot', label: 'N° Lot' },
  { key: 'Fabrication', label: 'Fabrication' },
  { key: 'Expiration', label: 'Expiration' },
  { key: 'article_code', label: 'Article code' },
];
