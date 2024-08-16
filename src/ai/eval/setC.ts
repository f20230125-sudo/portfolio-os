import type { Spec } from "./judge";

// Written before M3 routing changes. Keep these questions and expectations fixed.
// Documented attributes must be answered; undocumented ones must be declined.
export const setC: Spec[] = [
  { q: "How fast is his model on Raspberry Pi?", all: ["250 ms", "3.6", "3.2 W"] },
  { q: "Does Inbound support Microsoft Exchange?", decline: true, all: ["not on record", "read-only", "Gmail"] },
  { q: "How much power does his research model use?", all: ["3.2 W"] },
  { q: "Does Backroom integrate with SAP?", decline: true, all: ["not on record"] },
  { q: "How many GitHub requests did Agent Desk's first audit take?", all: ["30 GitHub requests"] },
  { q: "Does Flowboard support loops?", all: ["No loops"] },
  { q: "Does Hindsight export PDF reports?", decline: true, all: ["not on record"] },
  { q: "What is Sayso's voice transcription latency?", decline: true, all: ["not on record"] },
];
