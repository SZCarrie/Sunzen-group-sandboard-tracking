export type Widget =
  | "richtext"
  | "richtext_attachment"
  | "list_string"
  | "list_object"
  | "table"
  | "attachment"
  | "attachment_list";

export interface ObjectFieldDef {
  key: string;
  label: { zh: string; en: string };
  type: "text" | "date" | "number" | "textarea";
}

export interface FieldSchema {
  widget: Widget;
  objectFields?: ObjectFieldDef[];
}

// Field keys that live in the `goals` table (annual goal cascade) instead of
// `sandbox_sections`. Rendered by GoalsPanel, not the generic section editor.
export const GOAL_RECORD_FIELD_KEYS = [
  "goal_annual_business",
  "goal_annual_team",
  "goal_annual_personal",
  "goal_annual_work",
  "goal_quarterly_or_monthly",
] as const;

// gap_action_plans is rendered by ActionStepsPanel (backed by the `action_steps` table, with
// its own status/progress/goal-linkage), not the generic list_object section editor — same
// carve-out pattern as GOAL_RECORD_FIELD_KEYS above.
export const ACTION_STEP_FIELD_KEYS = ["gap_action_plans"] as const;

export type GoalType = "annual_business" | "annual_team" | "annual_personal" | "annual_work";

// goal_quarterly_or_monthly is deliberately absent: it has a role_template_rules row but no
// corresponding entry in the `goals` table's goal_type check constraint, so it's neither
// rendered as a section field nor as a goal panel anywhere yet.
export const GOAL_TYPE_BY_FIELD_KEY: Record<string, GoalType> = {
  goal_annual_business: "annual_business",
  goal_annual_team: "annual_team",
  goal_annual_personal: "annual_personal",
  goal_annual_work: "annual_work",
};

export const FIELD_SCHEMAS: Record<string, FieldSchema> = {
  vision_5yr: { widget: "richtext" },
  vision_10yr: { widget: "richtext" },
  mission: { widget: "richtext" },
  core_values: { widget: "list_string" },
  family_culture_points: {
    widget: "list_object",
    objectFields: [
      { key: "title", label: { zh: "标题", en: "Title" }, type: "text" },
      { key: "description", label: { zh: "说明", en: "Description" }, type: "textarea" },
    ],
  },
  energy_statement: { widget: "richtext" },
  company_systems: { widget: "richtext_attachment" },
  business_team_mgmt_table: {
    widget: "table",
    objectFields: [
      { key: "item", label: { zh: "事项", en: "Item" }, type: "text" },
      { key: "owner", label: { zh: "负责人", en: "Owner" }, type: "text" },
      { key: "frequency", label: { zh: "频率", en: "Frequency" }, type: "text" },
      { key: "description", label: { zh: "说明", en: "Description" }, type: "textarea" },
    ],
  },
  org_chart: { widget: "attachment" },
  training_plan: {
    widget: "list_object",
    objectFields: [
      { key: "department_goal", label: { zh: "部门目标", en: "Department Goal" }, type: "text" },
      { key: "training_goal", label: { zh: "培训目标", en: "Training Goal" }, type: "text" },
      { key: "implementation_step", label: { zh: "实施步骤", en: "Implementation Step" }, type: "textarea" },
    ],
  },
  team_building_plan: {
    widget: "list_object",
    objectFields: [
      { key: "activity", label: { zh: "活动", en: "Activity" }, type: "text" },
      { key: "goal", label: { zh: "目的", en: "Goal" }, type: "text" },
      { key: "timeline", label: { zh: "时间", en: "Timeline" }, type: "text" },
    ],
  },
  staffing_plan: {
    widget: "list_object",
    objectFields: [
      { key: "position", label: { zh: "职位", en: "Position" }, type: "text" },
      { key: "headcount", label: { zh: "人数", en: "Headcount" }, type: "number" },
      { key: "timeline", label: { zh: "时间", en: "Timeline" }, type: "text" },
    ],
  },
  team_morale_plan: { widget: "richtext" },
  employee_morale_plan: { widget: "richtext" },
  department_weapons: {
    widget: "list_object",
    objectFields: [
      { key: "tool_name", label: { zh: "工具/资源", en: "Tool" }, type: "text" },
      { key: "purpose", label: { zh: "用途", en: "Purpose" }, type: "text" },
      { key: "status", label: { zh: "状态", en: "Status" }, type: "text" },
    ],
  },
  swot_strengths: { widget: "list_string" },
  swot_weaknesses: { widget: "list_string" },
  swot_opportunities: { widget: "list_string" },
  swot_threats: { widget: "list_string" },
  competitor_analysis: {
    widget: "list_object",
    objectFields: [
      { key: "competitor", label: { zh: "同行/对手", en: "Competitor" }, type: "text" },
      { key: "gap_or_opportunity", label: { zh: "差距/机会", en: "Gap / Opportunity" }, type: "textarea" },
    ],
  },
  gap_action_plans: {
    widget: "list_object",
    objectFields: [
      { key: "related_swot_item", label: { zh: "对应弱点/威胁", en: "Related Weakness/Threat" }, type: "text" },
      { key: "solution_plan", label: { zh: "解决计划", en: "Solution Plan" }, type: "textarea" },
      { key: "implementation_steps", label: { zh: "实施步骤", en: "Implementation Steps" }, type: "textarea" },
      { key: "owner", label: { zh: "负责人", en: "Owner" }, type: "text" },
      { key: "deadline", label: { zh: "截止日期", en: "Deadline" }, type: "date" },
    ],
  },
  goal_3_5yr_sales_channel: {
    widget: "list_object",
    objectFields: [
      { key: "channel", label: { zh: "渠道", en: "Channel" }, type: "text" },
      { key: "target", label: { zh: "目标", en: "Target" }, type: "text" },
      { key: "year", label: { zh: "年份", en: "Year" }, type: "text" },
    ],
  },
  goal_3_5yr_org_structure: {
    widget: "attachment_list",
    objectFields: [
      { key: "year", label: { zh: "年份", en: "Year" }, type: "text" },
      { key: "headcount", label: { zh: "编制人数", en: "Headcount" }, type: "number" },
    ],
  },
  goal_3_5yr_financial: {
    widget: "list_object",
    objectFields: [
      { key: "year", label: { zh: "年份", en: "Year" }, type: "text" },
      { key: "revenue_target", label: { zh: "营收目标", en: "Revenue Target" }, type: "text" },
      { key: "profit_target", label: { zh: "利润目标", en: "Profit Target" }, type: "text" },
    ],
  },
  future_trend_opportunities: {
    widget: "list_object",
    objectFields: [
      { key: "trend", label: { zh: "趋势", en: "Trend" }, type: "text" },
      { key: "potential_impact", label: { zh: "潜在影响", en: "Potential Impact" }, type: "textarea" },
    ],
  },
  industry_development_trend: { widget: "richtext" },
  geo_development_blueprint: { widget: "richtext_attachment" },
};

// Short guidance shown under each field's label, adapted from
// Reference/Sunzen 2027 沙盘系统 · 示范版.html so the form reads the same way
// the approved demo does.
export const FIELD_HINTS: Record<string, { zh: string; en: string }> = {
  vision_5yr: { zh: "5年后团队要成为什么样子", en: "What the team should look like in 5 years" },
  vision_10yr: { zh: "10年后的样子", en: "What it looks like in 10 years" },
  mission: { zh: "我们为什么存在、为谁创造什么价值", en: "Why we exist, and what value we create for whom" },
  core_values: { zh: "团队做事的原则", en: "The principles the team acts on" },
  family_culture_points: {
    zh: "逐条写出6大要点，以及团队会怎样实践",
    en: "List all 6 points and how the team will practice them",
  },
  energy_statement: {
    zh: "团队现在的士气状态如何，怎样保持正能量",
    en: "How is team morale right now, and how do you keep the energy positive",
  },
  company_systems: {
    zh: "团队要执行或建立的制度、奖惩机制",
    en: "Systems and reward/discipline mechanisms the team will follow or set up",
  },
  business_team_mgmt_table: {
    zh: "用什么表格或会议管理业务和人，例：周报、月会",
    en: "What reports or meetings you use to manage the business and the team, e.g. weekly reports, monthly meetings",
  },
  org_chart: { zh: "有哪些岗位、各几人、向谁汇报", en: "What positions exist, headcount per role, and reporting lines" },
  training_plan: { zh: "部门目标、培训目标、实施步骤", en: "Department goals, training goals, and implementation steps" },
  team_building_plan: { zh: "团队建设活动计划", en: "Team-building activity plan" },
  staffing_plan: { zh: "每年要增加多少人、哪些岗位", en: "How many people to add each year, and which roles" },
  team_morale_plan: {
    zh: "怎样激励和鼓舞团队，例：表扬、奖励、庆祝活动",
    en: "How to motivate and inspire the team, e.g. recognition, rewards, celebrations",
  },
  employee_morale_plan: {
    zh: "怎样激励和鼓舞全体员工，例：表扬、奖励、庆祝活动",
    en: "How to motivate and inspire everyone, e.g. recognition, rewards, celebrations",
  },
  department_weapons: {
    zh: "核心工具、方法、资源、优势产品",
    en: "Core tools, methods, resources, and standout products",
  },
  swot_strengths: { zh: "内部做得好的", en: "What's working well internally" },
  swot_weaknesses: { zh: "内部不足的", en: "Where you're falling short internally" },
  swot_opportunities: { zh: "外部有什么对我们有利的变化", en: "External changes working in our favor" },
  swot_threats: { zh: "外部有什么对我们不利的变化", en: "External changes working against us" },
  competitor_analysis: {
    zh: "主要对手是谁、强在哪、我们从哪里赢",
    en: "Who the main competitors are, their strengths, and where we can win",
  },
  gap_action_plans: {
    zh: "每项拆成：原因 → 解决方法 → 负责人",
    en: "Break each one down: cause → solution → owner",
  },
  goal_3_5yr_sales_channel: {
    zh: "各渠道每年目标，例：经销商、网店、直销",
    en: "Yearly targets per channel, e.g. distributors, online store, direct sales",
  },
  goal_3_5yr_org_structure: {
    zh: "每年要增加多少人、组织怎么变化",
    en: "Headcount and structure plan by year",
  },
  goal_3_5yr_financial: { zh: "填写下方表格", en: "Fill in the table below" },
  future_trend_opportunities: {
    zh: "行业未来3到5年的趋势，我们能抓住什么",
    en: "Industry trends over the next 3-5 years, and what we can capture",
  },
  industry_development_trend: {
    zh: "细分行业未来3到5年的趋势",
    en: "Trends in our specific industry over the next 3-5 years",
  },
  geo_development_blueprint: { zh: "未来要进入哪些地区、时间表", en: "Which regions to enter, and the timeline" },
};
