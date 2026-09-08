export const diagnosticStyles = `
.local-debug { color: #293630; border-top: 1px solid #e0e6dd; margin-top: 32px; padding-top: 28px; line-height: 1.65; }
.local-debug h2 { font-size: 1.5rem; line-height: 1.4; margin: 8px 0; }
.local-debug .eyebrow { color: #58665d; font-size: .875rem; font-weight: 600; margin: 0; }
.local-debug .muted { color: #58665d; font-size: .875rem; }
.local-debug button, .local-debug select { font: inherit; border-radius: 6px; padding: 9px 14px; border: 1px solid #a8bbb4; margin: 4px 8px 4px 0; max-width: 100%; }
.local-debug button { cursor: pointer; }
.local-debug .primary { background: #285642; color: white; border-color: #285642; }
.local-debug .secondary { background: #fff; color: #293630; }
.local-debug button:disabled { cursor: not-allowed; opacity: .5; }
.local-debug :is(button, select, summary, a):focus-visible { outline: 3px solid #285642; outline-offset: 3px; }
.local-debug .diagnostic-controls { background: #f7f9f6; border: 1px solid #e0e6dd; border-radius: 6px; padding: 18px; margin: 22px 0; }
.local-debug label { display: block; font-weight: 600; margin-top: 12px; }
.local-debug select { display: block; width: 100%; background: white; }
.local-debug .request-error { padding: 16px; border-left: 3px solid #9c4747; background: #fff2f2; }
.local-debug summary { cursor: pointer; padding: 12px; overflow-wrap: anywhere; }
.local-debug .connection-tools { margin-top: 18px; border-top: 1px solid #e0e6dd; padding-top: 8px; }
.local-debug pre { background: #f3f5f4; padding: 16px; overflow: auto; max-height: 480px; font-size: .875rem; }
.local-debug .privacy-note { margin-top: 22px; }
`;

export const resultStyles = `
.diagnostic-results { --ink: #293630; --muted: #58665d; --line: #e0e6dd; --accent: #285642; color: var(--ink); font-family: system-ui, sans-serif; line-height: 1.65; overflow-wrap: anywhere; }
.diagnostic-results * { box-sizing: border-box; }
.diagnostic-results h2 { font-size: 1.65rem; font-weight: 650; line-height: 1.4; margin: 8px 0 16px; }
.diagnostic-results h3 { font-size: 1.125rem; margin: 0 0 8px; }
.diagnostic-results h4 { font-size: 1rem; margin: 0 0 6px; }
.diagnostic-results p { margin: 8px 0; }
.diagnostic-results .eyebrow, .diagnostic-results .muted { color: var(--muted); font-size: .875rem; }
.diagnostic-results .eyebrow { font-weight: 600; }
.diagnostic-results .result-banner { padding: 0 0 20px; margin: 24px 0 0; border-bottom: 1px solid var(--line); }
.diagnostic-results .result-banner.incomplete { border-left: 3px solid #9b793f; padding-left: 18px; }
.diagnostic-results .result-overview { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.7fr); gap: 28px; padding: 24px 0; border-bottom: 1px solid var(--line); }
.diagnostic-results .prototype-estimate { border-left: 1px solid var(--line); padding-left: 28px; }
.diagnostic-results .candidate-count strong { font-size: 1.15rem; }
.diagnostic-results .estimate-total { color: var(--accent); font-size: 2rem; font-weight: 650; letter-spacing: -.025em; font-variant-numeric: tabular-nums; margin: 0; }
.diagnostic-results .candidate-list-heading { margin-top: 28px; }
.diagnostic-results .rule-result { margin: 24px 0 32px; }
.diagnostic-results .badge { display: inline-block; font-size: .75rem; font-weight: 500; background: #edf2e9; color: #38523c; border-radius: 4px; padding: 2px 7px; vertical-align: middle; }
.diagnostic-results summary { cursor: pointer; padding: 12px 0; overflow-wrap: anywhere; }
.diagnostic-results summary:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }
.diagnostic-results .candidate { border-bottom: 1px solid var(--line); }
.diagnostic-results .candidate:first-of-type { border-top: 1px solid var(--line); }
.diagnostic-results .candidate > summary { display: grid; grid-template-columns: 16px minmax(0, 1.2fr) minmax(0, 1fr) minmax(0, 1fr); gap: 12px; align-items: center; list-style: none; padding: 18px 8px; }
.diagnostic-results .candidate > summary::-webkit-details-marker { display: none; }
.diagnostic-results .candidate > summary::before { content: '›'; font-size: 1.25rem; }
.diagnostic-results .candidate[open] > summary::before { content: '⌄'; }
.diagnostic-results .candidate > summary:hover { background: #f7f9f6; }
.diagnostic-results .candidate > summary strong { font-size: .9375rem; font-weight: 600; }
.diagnostic-results .candidate > summary span { font-size: .875rem; color: var(--muted); }
.diagnostic-results .candidate > summary .candidate-amount { text-align: right; color: var(--ink); font-variant-numeric: tabular-nums; }
.diagnostic-results .candidate-body { padding: 8px 24px 20px; background: #f7f9f6; }
.diagnostic-results .resource-id { font-family: ui-monospace, monospace; font-size: .8125rem; overflow-wrap: anywhere; }
.diagnostic-results .evidence-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.diagnostic-results dt { font-size: .875rem; color: var(--muted); }
.diagnostic-results dd { margin: 3px 0 0; }
.diagnostic-results .review-note { border-left: 2px solid #b5c4ad; padding-left: 14px; }
.diagnostic-results .gaps { padding: 0 16px; background: #faf5e9; }
.diagnostic-results .collection-results { padding: 24px 0; border-top: 1px solid var(--line); }
.diagnostic-results .collection-results > details { border-bottom: 1px solid var(--line); }
.diagnostic-results li { margin: 8px 0; }
.diagnostic-results .empty-result { padding: 14px; background: #f7f9f6; }
.diagnostic-results .json-result { border-top: 1px solid var(--line); padding-top: 8px; }
.diagnostic-results pre { background: #f3f5f4; padding: 16px; overflow: auto; max-height: 480px; font-size: .8125rem; }
@media (max-width: 600px) {
  .diagnostic-results .result-overview, .diagnostic-results .evidence-grid { grid-template-columns: 1fr; }
  .diagnostic-results .prototype-estimate { border-left: 0; border-top: 1px solid var(--line); padding: 20px 0 0; }
  .diagnostic-results .candidate > summary { grid-template-columns: 16px minmax(0, 1fr); gap: 4px 10px; }
  .diagnostic-results .candidate > summary span { grid-column: 2; }
  .diagnostic-results .candidate > summary .candidate-amount { text-align: left; }
  .diagnostic-results .candidate-body { padding: 8px 16px 16px; }
}
`;
