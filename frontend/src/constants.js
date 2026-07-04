// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
export const CSV_API_URL = `${API_BASE_URL}/api/data/csv`;
export const STATUS_API_URL = `${API_BASE_URL}/api/status`;
export const BUNDLED_CSV_URL = '/ACM_data.csv';

// GitHub raw URL for latest CSV (updated monthly by GitHub Actions)
// Set VITE_GITHUB_CSV_URL in .env to enable — e.g.:
//   https://raw.githubusercontent.com/YOUR_USER/YOUR_REPO/main/frontend/public/ACM_data.csv
export const GITHUB_CSV_URL = import.meta.env.VITE_GITHUB_CSV_URL || null;

// Storage Keys
export const STORAGE_KEY = 'acm_csv_data';
export const STORAGE_TIMESTAMP_KEY = 'acm_data_timestamp';
export const STORAGE_SOURCE_KEY = 'acm_data_source';
export const STORAGE_REFRESH_DATE_KEY = 'acm_last_refresh_date';
export const STORAGE_BACKEND_UPDATE_KEY = 'acm_backend_last_update';

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
