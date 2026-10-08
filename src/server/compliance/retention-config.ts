/**
 * LEGAL DISCLAIMER & STATUTORY NOTICE:
 * Retention durations below are provisional placeholders pending formal sign-off
 * from legal counsel under the Digital Personal Data Protection Act (2023),
 * Income Tax Act (1961), and relevant State Stamp Acts.
 * 
 * [Architecture Rule]: These values MUST NOT be hardcoded in queries or business logic.
 */

export const RETENTION_CONFIG = {
  // Leads that never converted into a verified listing or signed agreement
  UNCONVERTED_LEAD_RETENTION_DAYS: parseInt(
    process.env.RETENTION_UNCONVERTED_LEAD_DAYS || '180',
    10
  ), // Provisional placeholder: 180 days

  // Customer search queries, viewing history, and inactive sessions
  TELEMETRY_AND_SEARCH_RETENTION_DAYS: parseInt(
    process.env.RETENTION_TELEMETRY_DAYS || '90',
    10
  ), // Provisional placeholder: 90 days

  // Completed transaction & legal escrow records subject to statutory tax / limitation hold
  STATUTORY_TRANSACTION_HOLD_DAYS: parseInt(
    process.env.RETENTION_STATUTORY_HOLD_DAYS || '2920',
    10
  ), // Provisional placeholder: 8 years (2920 days)
};
