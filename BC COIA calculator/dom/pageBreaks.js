/**
 * Page breaks module.
 * This file is now a facade that imports from the refactored module structure.
 */

import { updatePagination, setupPaginationListeners } from './pageBreaks/index.js';

// Re-export the functions
export { updatePagination, setupPaginationListeners };
