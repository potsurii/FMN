import { Archive } from "@/components/fmn/archive";
import { Closing } from "@/components/fmn/closing";
import { Companion } from "@/components/fmn/companion";
import { Discovery } from "@/components/fmn/discovery";
import { Hero } from "@/components/fmn/hero";
import { PageTurn } from "@/components/fmn/page-turn";
import { Records } from "@/components/fmn/records";
import { ScrollEngine } from "@/components/fmn/scroll-engine";
import { SiteNav } from "@/components/fmn/site-nav";
import { Todo } from "@/components/fmn/todo";
import { createClient } from "@/lib/supabase/server";

export default async function LandingPage() {
  let homeHref = "/";
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) homeHref = "/home";
  } catch {
    homeHref = "/";
  }

  return (
    <div className="fmn-landing">
      <SiteNav homeHref={homeHref} />
      <main>
        <Hero />
        <PageTurn
          from="01 — Cover"
          chapter="Chapter 01"
          title="Personal archive"
          teaser="your trips, kept like zines"
        />
        <Archive />
        <PageTurn
          from="01 — Archive"
          chapter="Chapter 02"
          title="Shopping records"
          teaser="stamps, receipts, one-line notes"
        />
        <Records />
        <PageTurn
          from="02 — Records"
          chapter="Chapter 03"
          title="Shared discovery"
          teaser="follow the thread to the trip"
        />
        <Discovery />
        <PageTurn
          from="03 — Discovery"
          chapter="Chapter 04"
          title="Shopping todo"
          teaser="planned today, recorded tomorrow"
        />
        <Todo />
        <PageTurn
          from="04 — Todo"
          chapter="Chapter 05"
          title="The companion"
          teaser="a quiet helper in the margin"
        />
        <Companion />
        <PageTurn
          from="05 — Companion"
          chapter="Last page"
          title="Keep it. Pass it on."
          teaser="start your first booklet"
        />
        <Closing />
      </main>
      <ScrollEngine />
    </div>
  );
}
