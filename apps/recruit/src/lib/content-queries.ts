import { cache } from "react";
import { formatDay, formatDayTime } from "@/lib/schedule";
import { createClient } from "@/lib/supabase/server";
import {
  applicationFields as defaultFields,
  defaultLandingContent,
  motivationField,
  recruitConfig as defaultConfig,
  type FormField,
  type LandingContent,
  type RecruitConfig,
} from "@/lib/recruit-config";

export const LANDING_BUCKET = "landing-photos";

interface SettingsRow {
  applications_open: boolean;
  cohort_label: string;
  apply_start: string;
  apply_end: string;
  first_result_date: string;
  interview_range: string;
  final_result_date: string;
  interview_lock_at: string | null;
  apply_start_at: string | null;
  apply_end_at: string | null;
  first_result_at: string | null;
  final_result_at: string | null;
}

/** 관리자가 아직 안 채운 칸은 기본값을 그대로 쓴다 — 빈 화면을 내보내지 않는다 */
function or<T>(value: T | null | undefined, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string" && value.trim() === "") return fallback;
  if (Array.isArray(value) && value.length === 0) return fallback;
  if (typeof value === "object" && Object.keys(value as object).length === 0) return fallback;
  return value;
}

/** 저장된 기수 표기("26-2기 · 2026학년도 2학기")에서 연도·학기를 되짚는다 */
function parseCohort(label: string) {
  const m = label.match(/(\d{2})-(\d)기/);
  if (!m) return { year: defaultConfig.year, semesterNo: defaultConfig.semesterNo };
  return {
    year: 2000 + Number(m[1]),
    semesterNo: (Number(m[2]) === 1 ? 1 : 2) as 1 | 2,
  };
}

export interface RecruitSettings extends RecruitConfig {
  /** 관리자 화면에서 그대로 보여줄 원문 표기 */
  cohortLabelText: string;
}

export const getRecruitSettings = cache(async (): Promise<RecruitSettings> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("recruit_settings")
    .select(
      "*"
    )
    .eq("id", 1)
    .maybeSingle();

  const row = data as SettingsRow | null;
  const cohortLabelText = or(
    row?.cohort_label,
    `${String(defaultConfig.year).slice(2)}-${defaultConfig.semesterNo}기 · ${defaultConfig.semester}`,
  );
  const { year, semesterNo } = parseCohort(cohortLabelText);

  return {
    ...defaultConfig,
    year,
    semesterNo,
    semester: cohortLabelText.split("·").pop()?.trim() || defaultConfig.semester,
    applicationsOpen: row?.applications_open ?? defaultConfig.applicationsOpen,
    // 시각을 정해뒀으면 문구도 거기서 만든다 (따로 적어둔 글자보다 우선)
    applyStart: formatDay(row?.apply_start_at) || or(row?.apply_start, defaultConfig.applyStart),
    applyEnd: formatDay(row?.apply_end_at) || or(row?.apply_end, defaultConfig.applyEnd),
    firstResultDate:
      formatDayTime(row?.first_result_at) || or(row?.first_result_date, defaultConfig.firstResultDate),
    interviewRange: or(row?.interview_range, defaultConfig.interviewRange),
    finalResultDate:
      formatDayTime(row?.final_result_at) || or(row?.final_result_date, defaultConfig.finalResultDate),
    // 비어 있는 것이 "잠그지 않음" 이라는 뜻이므로 기본값으로 채우지 않는다
    interviewLockAt: row?.interview_lock_at ?? null,
    applyStartAt: row?.apply_start_at ?? null,
    applyEndAt: row?.apply_end_at ?? null,
    firstResultAt: row?.first_result_at ?? null,
    finalResultAt: row?.final_result_at ?? null,
    cohortLabelText,
  };
});

interface LandingRow {
  hero_slides: LandingContent["heroSlides"] | null;
  about_body: string | null;
  about_facts: LandingContent["aboutFacts"] | null;
  about_photo: LandingContent["aboutPhoto"] | null;
  activities_lead: string | null;
  activity_cards: LandingContent["activityCards"] | null;
  recruiting_lead: string | null;
  checklist_title: string | null;
  checklist: string[] | null;
  quote: string | null;
  faqs: LandingContent["faqs"] | null;
  footer_address: string | null;
  footer_instagram: string | null;
  interview_place: string | null;
  next_steps: string[] | null;
}

export function rowToLanding(row: LandingRow | null): LandingContent {
  const d = defaultLandingContent;
  return {
    heroSlides: or(row?.hero_slides, d.heroSlides),
    aboutBody: or(row?.about_body, d.aboutBody),
    aboutFacts: or(row?.about_facts, d.aboutFacts),
    aboutPhoto: or(row?.about_photo, d.aboutPhoto),
    activitiesLead: or(row?.activities_lead, d.activitiesLead),
    activityCards: or(row?.activity_cards, d.activityCards),
    recruitingLead: or(row?.recruiting_lead, d.recruitingLead),
    checklistTitle: or(row?.checklist_title, d.checklistTitle),
    checklist: or(row?.checklist, d.checklist),
    quote: or(row?.quote, d.quote),
    faqs: or(row?.faqs, d.faqs),
    footerAddress: or(row?.footer_address, d.footerAddress),
    footerInstagram: or(row?.footer_instagram, d.footerInstagram),
    interviewPlace: or(row?.interview_place, d.interviewPlace),
    nextSteps: or(row?.next_steps, d.nextSteps),
  };
}

export const LANDING_SELECT =
  "hero_slides, about_body, about_facts, about_photo, activities_lead, activity_cards, recruiting_lead, checklist_title, checklist, quote, faqs, footer_address, footer_instagram, interview_place, next_steps";

export const getLandingContent = cache(async (): Promise<LandingContent> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("landing_content")
    .select(LANDING_SELECT)
    .eq("id", 1)
    .maybeSingle();
  return rowToLanding(data as LandingRow | null);
});

interface FieldRow {
  name: string;
  label: string;
  placeholder: string;
  field_type: FormField["type"];
  required: boolean;
  max_length: number | null;
  sort_order: number;
}

export function rowToField(r: FieldRow): FormField {
  return {
    name: r.name,
    label: r.label,
    placeholder: r.placeholder,
    type: r.field_type,
    required: r.required,
    ...(r.max_length ? { maxLength: r.max_length } : {}),
  };
}

/**
 * 지원서 문항. 관리자가 한 번도 저장하지 않았으면 기본 문항을 쓴다 —
 * 표가 비었다고 지원서를 빈 화면으로 내보낼 수는 없다.
 */
export const getApplicationFields = cache(async (): Promise<FormField[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("application_fields")
    .select("name, label, placeholder, field_type, required, max_length, sort_order")
    .order("sort_order");

  const rows = (data ?? []) as FieldRow[];
  if (rows.length === 0) return [...defaultFields, motivationField];
  return rows.map(rowToField);
});
