import type { RoleFamily } from "../types.js";

const RULES: { role: RoleFamily; patterns: RegExp[] }[] = [
  {
    role: "Security",
    patterns: [
      /security|audit|auditor|漏洞|安全|slither|mythril|bug\s*bounty/i,
    ],
  },
  {
    role: "Research",
    patterns: [
      /research|analyst|研报|researcher|tokenomics|governance research/i,
    ],
  },
  {
    role: "Product",
    patterns: [/product manager|\bpm\b|产品经理|product lead|product owner/i],
  },
  {
    role: "Community",
    patterns: [
      /community|moderator|ambassador|社群|discord|community manager|运营/i,
    ],
  },
  {
    role: "BD",
    patterns: [
      /\bbd\b|business development|growth|partnership|商务|增长|销售|sales/i,
    ],
  },
  {
    role: "Engineering",
    patterns: [
      /engineer|developer|solidity|rust|frontend|backend|full\s*stack|智能合约|开发/i,
    ],
  },
];

export function inferRoleFamily(title: string, body: string): RoleFamily {
  const text = `${title}\n${body}`;
  for (const r of RULES) {
    if (r.patterns.some((p) => p.test(text))) return r.role;
  }
  return "Other";
}

export function inferRemote(
  location: string,
  body: string
): "remote" | "hybrid" | "onsite" | "unknown" {
  const t = `${location} ${body}`.toLowerCase();
  if (/remote|远程|work from home|wfh|anywhere/.test(t)) return "remote";
  if (/hybrid|混合/.test(t)) return "hybrid";
  if (/onsite|on-site|office|现场|坐班/.test(t)) return "onsite";
  return "unknown";
}
