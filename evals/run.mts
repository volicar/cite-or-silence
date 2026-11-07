import { OFFLINE_MIN_SCORE, runRetrievalEval } from "./eval";

const report = await runRetrievalEval();
const pct = (x: number) => `${(x * 100).toFixed(0)}%`;
console.log(`cite-or-silence retrieval eval (offline, HashEmbedder, minScore=${OFFLINE_MIN_SCORE})`);
console.log(`  hit@1:               ${pct(report.hitAt1)}`);
console.log(`  hit@3:               ${pct(report.hitAt3)}`);
console.log(`  MRR:                 ${report.mrr.toFixed(2)}`);
console.log(`  abstention accuracy: ${pct(report.abstentionAccuracy)}`);
console.log(`  false abstentions:   ${report.falseAbstentions}`);
for (const f of report.failures) console.log(`  - ${f}`);
