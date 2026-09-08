export const diagnosticStyles = `
.local-debug { color: #243432; border-top: 1px solid #d8e2df; margin-top: 32px; padding-top: 28px; line-height: 1.65; }
.local-debug h2 { font-size: 1.5rem; line-height: 1.4; margin: 8px 0; }
.local-debug h3 { font-size: 1.25rem; margin: 8px 0; }
.local-debug h4 { font-size: 1.05rem; margin: 0 0 10px; }
.local-debug .eyebrow { color: #486660; font-size: .8rem; font-weight: 700; letter-spacing: .06em; margin: 0; }
.local-debug .muted { color: #536862; font-size: .88rem; }
.local-debug button, .local-debug select { font: inherit; border-radius: 7px; padding: 9px 14px; border: 1px solid #a8bbb4; margin: 4px 8px 4px 0; max-width: 100%; }
.local-debug button { cursor: pointer; }
.local-debug .primary { background: #176354; color: white; border-color: #176354; }
.local-debug .secondary { background: #fff; color: #243432; }
.local-debug button:disabled { cursor: not-allowed; opacity: .5; }
.local-debug :is(button, select, summary):focus-visible { outline: 3px solid #3285a3; outline-offset: 3px; }
.local-debug .diagnostic-controls { background: #f5f8f7; border: 1px solid #d8e2df; border-radius: 10px; padding: 18px; margin: 22px 0; }
.local-debug label { display: block; font-weight: 600; margin-top: 12px; }
.local-debug select { display: block; width: 100%; background: white; }
.local-debug .result-banner { padding: 20px; border: 1px solid #c9ded5; background: #f0f7f3; border-radius: 10px; margin: 20px 0; }
.local-debug .result-banner.incomplete, .local-debug .gaps { background: #fff8e9; border-color: #dbc494; }
.local-debug .request-error { padding: 16px; border: 1px solid #d6a2a2; border-radius: 8px; background: #fff2f2; }
.local-debug .rule-result { margin: 24px 0; }
.local-debug .badge { display: inline-block; font-size: .75rem; font-weight: 500; background: #e8efec; color: #354e46; border-radius: 5px; padding: 2px 7px; white-space: nowrap; }
.local-debug .candidate { border: 1px solid #d8e2df; border-radius: 8px; margin: 10px 0; background: white; }
.local-debug summary { cursor: pointer; padding: 12px; overflow-wrap: anywhere; }
.local-debug .candidate summary > span { margin-left: 10px; font-size: .8rem; }
.local-debug .candidate-body { padding: 0 16px 16px; }
.local-debug .resource-id { font-family: ui-monospace, monospace; font-size: .8rem; overflow-wrap: anywhere; }
.local-debug .evidence-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.local-debug dt { font-size: .8rem; color: #536862; }
.local-debug dd { margin: 3px 0 0; overflow-wrap: anywhere; }
.local-debug .gaps, .local-debug .collection-results { border: 1px solid #d8e2df; border-radius: 8px; padding: 8px; }
.local-debug .collection-results { padding: 16px; }
.local-debug li { margin: 8px 0; overflow-wrap: anywhere; }
.local-debug .empty-result { padding: 14px; background: #f5f8f7; border-radius: 6px; }
.local-debug .json-result, .local-debug .connection-tools { margin-top: 18px; border-top: 1px solid #d8e2df; padding-top: 8px; }
.local-debug pre { background: #f3f5f4; padding: 16px; overflow: auto; max-height: 480px; font-size: .8rem; }
.local-debug .privacy-note { margin-top: 22px; }
.local-debug .prototype-estimate { background: #f5f8f7; border: 1px solid #c9ded5; border-radius: 10px; padding: 20px; margin: 20px 0; }
.local-debug .prototype-estimate h4 { margin-top: 8px; }
.local-debug .estimate-total { font-size: 2rem; font-weight: 700; letter-spacing: -.03em; margin: 6px 0; color: #176354; }
@media (max-width: 520px) { .local-debug .evidence-grid { grid-template-columns: 1fr; } .local-debug .candidate summary > span { display: block; margin-left: 16px; margin-top: 3px; } }
`;
