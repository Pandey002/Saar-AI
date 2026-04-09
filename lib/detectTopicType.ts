import type { TopicType } from "@/types";

const TOPIC_PATTERNS: Array<{ type: TopicType; pattern: RegExp }> = [
  {
    type: "math",
    pattern:
      /\b(solve|differentiate|integrate|equation|algebra|calculus|trigonometry|matrix|probability|permutation|combination|mean|median|mode|quadratic|dy\/dx|limit)\b/i,
  },
  {
    type: "physics",
    pattern:
      /\b(force|velocity|acceleration|newton|friction|projectile|current|voltage|resistance|wave|optics|thermodynamics|momentum|gravitation|power|energy|unit)\b/i,
  },
  {
    type: "chemistry",
    pattern:
      /\b(reaction|stoichiometry|mole|molar|equilibrium|acid|base|salt|organic|mechanism|bond|compound|oxidation|reduction|balance|chemical)\b/i,
  },
  {
    type: "biology",
    pattern:
      /\b(cell|photosynthesis|respiration|dna|rna|protein|enzyme|tissue|organ|genetics|evolution|digestion|reproduction|anatomy|physiology)\b/i,
  },
  {
    type: "history",
    pattern:
      /\b(empire|revolution|war|treaty|dynasty|colonial|independence|mughal|world war|causes of|consequences of|timeline|historical)\b/i,
  },
  {
    type: "geography",
    pattern:
      /\b(climate|monsoon|soil|plateau|mountain|river|map|erosion|earthquake|cyclone|urbanisation|resources|latitude|longitude|geography)\b/i,
  },
  {
    type: "economics",
    pattern:
      /\b(demand|supply|price|inflation|gdp|market|elasticity|recession|policy|tax|subsidy|fiscal|monetary|economics)\b/i,
  },
  {
    type: "literature",
    pattern:
      /\b(poem|poetry|novel|character|theme|symbolism|metaphor|stanza|prose|literature|author|narrator|imagery)\b/i,
  },
  {
    type: "logic",
    pattern:
      /\b(algorithm|array|string|binary|tree|graph|complexity|puzzle|reasoning|coding|program|loop|edge case|logic)\b/i,
  },
];

export function detectTopicType(input: string): TopicType {
  const normalized = input.trim();
  if (!normalized) {
    return "general";
  }

  for (const entry of TOPIC_PATTERNS) {
    if (entry.pattern.test(normalized)) {
      return entry.type;
    }
  }

  return "general";
}
