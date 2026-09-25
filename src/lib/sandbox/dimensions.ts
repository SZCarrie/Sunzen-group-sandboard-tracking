import type { Locale } from "@/lib/i18n/dictionary";

export const DIMENSION_ORDER = ["dao", "fa", "jiang", "shi", "qi", "shu", "tian", "di"] as const;

export type Dimension = (typeof DIMENSION_ORDER)[number];

const DIMENSION_GLYPHS: Record<Dimension, string> = {
  dao: "道",
  fa: "法",
  jiang: "将",
  shi: "势",
  qi: "器",
  shu: "术",
  tian: "天",
  di: "地",
};

const DIMENSION_ROMAN: Record<Dimension, string> = {
  dao: "Dao",
  fa: "Fa",
  jiang: "Jiang",
  shi: "Shi",
  qi: "Qi",
  shu: "Shu",
  tian: "Tian",
  di: "Di",
};

const DIMENSION_SUBTITLES: Record<Locale, Record<Dimension, string>> = {
  zh: {
    dao: "信念 / 初心",
    fa: "制度 / 机制",
    jiang: "人 / 团队",
    shi: "团队 / 员工士气",
    qi: "工具 / 武器",
    shu: "打法 / 执行方法",
    tian: "时机 / 趋势",
    di: "位置 / 根基",
  },
  en: {
    dao: "Belief / Purpose",
    fa: "Systems / Mechanisms",
    jiang: "People / Team",
    shi: "Team / Employee Morale",
    qi: "Tools / Resources",
    shu: "Tactics / Execution",
    tian: "Timing / Trends",
    di: "Position / Foundation",
  },
};

// the glyph (道/法/…) as it appears in Chinese, in both locales — used wherever
// space is tight and the character itself carries more identity than a translit.
export function getDimensionGlyph(dimension: Dimension): string {
  return DIMENSION_GLYPHS[dimension];
}

export function getDimensionRoman(dimension: Dimension): string {
  return DIMENSION_ROMAN[dimension];
}

export function getDimensionSubtitle(locale: Locale, dimension: Dimension): string {
  return DIMENSION_SUBTITLES[locale][dimension];
}

export function getDimensionLabel(locale: Locale, dimension: Dimension): string {
  const lead = locale === "zh" ? DIMENSION_GLYPHS[dimension] : DIMENSION_ROMAN[dimension];
  return `${lead} · ${DIMENSION_SUBTITLES[locale][dimension]}`;
}

// literal Tailwind class names (must stay literal for the JIT scanner to find them)
export const DIMENSION_CLASSES: Record<
  Dimension,
  { text: string; border: string; bg: string; wash: string }
> = {
  dao: { text: "text-dim-dao", border: "border-dim-dao", bg: "bg-dim-dao", wash: "bg-dim-dao-wash" },
  fa: { text: "text-dim-fa", border: "border-dim-fa", bg: "bg-dim-fa", wash: "bg-dim-fa-wash" },
  jiang: { text: "text-dim-jiang", border: "border-dim-jiang", bg: "bg-dim-jiang", wash: "bg-dim-jiang-wash" },
  shi: { text: "text-dim-shi", border: "border-dim-shi", bg: "bg-dim-shi", wash: "bg-dim-shi-wash" },
  qi: { text: "text-dim-qi", border: "border-dim-qi", bg: "bg-dim-qi", wash: "bg-dim-qi-wash" },
  shu: { text: "text-dim-shu", border: "border-dim-shu", bg: "bg-dim-shu", wash: "bg-dim-shu-wash" },
  tian: { text: "text-dim-tian", border: "border-dim-tian", bg: "bg-dim-tian", wash: "bg-dim-tian-wash" },
  di: { text: "text-dim-di", border: "border-dim-di", bg: "bg-dim-di", wash: "bg-dim-di-wash" },
};

export type Requirement = "required" | "optional" | "view_only" | "not_applicable";

const REQUIREMENT_LABELS: Record<Locale, Record<Requirement, string>> = {
  zh: {
    required: "必填",
    optional: "选填",
    view_only: "只读展示",
    not_applicable: "不适用",
  },
  en: {
    required: "Required",
    optional: "Optional",
    view_only: "View only",
    not_applicable: "N/A",
  },
};

export function getRequirementLabel(locale: Locale, requirement: Requirement): string {
  return REQUIREMENT_LABELS[locale][requirement];
}

const ROLE_LABELS: Record<Locale, Record<string, string>> = {
  zh: {
    employee: "员工",
    supervisor: "主管",
    subsidiary_head: "子公司负责人",
    super_admin: "超级管理员",
    group_md: "集团董事总经理",
  },
  en: {
    employee: "Employee",
    supervisor: "Manager",
    subsidiary_head: "Subsidiary Head",
    super_admin: "Super Admin",
    group_md: "Group MD",
  },
};

export function getRoleLabel(locale: Locale, role: string): string {
  return ROLE_LABELS[locale][role] ?? role;
}

// only super_admin gets full admin management access (roles/organizations/cycles/field
// rules) — group_md is a separate, narrower tier (see isOversightRole below), not folded
// in here, since it must not gain write access to any of those pages.
export function isAdminTierRole(role: string): boolean {
  return role === "super_admin";
}

// group_md gets read-only oversight of the admin overview + every sandbox document, on top
// of its own subsidiary_head-equivalent sandbox, without any of super_admin's management
// writes. Used to gate entry to /admin (layout-level) and to show the Overview nav link.
export function isOversightRole(role: string): boolean {
  return role === "super_admin" || role === "group_md";
}

// role_template_rules.field_label is stored in Chinese in the database (see
// docs/sandbox-framework.md). This maps the same field_key to an English label
// for the UI, rather than duplicating a field_label_en column in the schema.
const FIELD_LABELS_EN: Record<string, string> = {
  vision_5yr: "5-Year Vision",
  vision_10yr: "10-Year Vision",
  mission: "Mission",
  core_values: "Core Values",
  family_culture_points: "6 Pillars of Family Culture",
  energy_statement: "Energy",
  company_systems: "Company Systems & Mechanisms",
  business_team_mgmt_table: "Business & Team Management Table",
  org_chart: "Org Chart",
  training_plan: "Team Training Plan",
  team_building_plan: "Team Building Plan",
  staffing_plan: "Staffing Plan",
  team_morale_plan: "Team Morale Building",
  employee_morale_plan: "Employee Morale Building",
  department_weapons: "Department Weapons (Tools)",
  swot_strengths: "Strengths",
  swot_weaknesses: "Weaknesses",
  swot_opportunities: "Opportunities",
  swot_threats: "Threats",
  competitor_analysis: "Competitor / Peer Analysis",
  gap_action_plans: "Action Plans & Implementation Steps",
  goal_3_5yr_sales_channel: "3-5 Year Sales Channel Goals",
  goal_3_5yr_org_structure: "3-5 Year Org Structure",
  goal_3_5yr_financial: "5-Year Financial Goals",
  goal_annual_business: "Annual Business Goals",
  goal_annual_team: "Annual Team Goals",
  goal_annual_personal: "Annual Personal Goals",
  goal_annual_work: "Work Goals",
  goal_quarterly_or_monthly: "Quarterly/Monthly KPIs",
  future_trend_opportunities: "Future Trend Opportunities",
  industry_development_trend: "Industry Development Trends",
  geo_development_blueprint: "Geographic Development Blueprint",
};

export function getFieldLabel(locale: Locale, fieldKey: string, fallbackZh: string): string {
  if (locale === "zh") return fallbackZh;
  return FIELD_LABELS_EN[fieldKey] ?? fallbackZh;
}
