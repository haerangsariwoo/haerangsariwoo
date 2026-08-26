import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import {
  homeCopy as defaultHomeCopy,
  memberFaqs as defaultFaqs,
  noticeCopies as defaultNoticeCopies,
  type AppFaq,
  type NoticeCopy,
} from "@/lib/app-content";

export interface HomeCopy {
  greetingSuffix: string;
  subGreeting: string;
}

export interface AppContent {
  homeCopy: HomeCopy;
  faqs: AppFaq[];
  noticeCopies: NoticeCopy[];
}

export const APP_CONTENT_SELECT = "home_copy, faqs, notice_copies";

interface Row {
  home_copy: Partial<HomeCopy> | null;
  faqs: AppFaq[] | null;
  notice_copies: NoticeCopy[] | null;
}

/** 관리자가 아직 안 채운 칸은 기존 문구를 그대로 쓴다 — 빈 화면을 내보내지 않는다 */
export function rowToContent(row: Row | null): AppContent {
  const home = row?.home_copy;
  return {
    homeCopy: {
      greetingSuffix: home?.greetingSuffix?.trim() || defaultHomeCopy.greetingSuffix,
      subGreeting: home?.subGreeting?.trim() || defaultHomeCopy.subGreeting,
    },
    faqs: row?.faqs?.length ? row.faqs : defaultFaqs,
    noticeCopies: row?.notice_copies?.length ? row.notice_copies : defaultNoticeCopies,
  };
}

export const getAppContent = cache(async (): Promise<AppContent> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("app_content")
    .select(APP_CONTENT_SELECT)
    .eq("id", 1)
    .maybeSingle();
  return rowToContent(data as Row | null);
});
