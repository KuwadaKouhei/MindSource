import { getSession, createSupabaseServerClient } from "@/lib/supabase/server";
import { ScanOverlay } from "@/components/ui/primitives/ScanOverlay";
import { HomeNav } from "@/components/home/HomeNav";
import { Hero } from "@/components/home/Hero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { Features } from "@/components/home/Features";
import { CtaBand } from "@/components/home/CtaBand";
import { Footer } from "@/components/home/Footer";
import { MyMapsStrip } from "@/components/home/MyMapsStrip";
import { RevealObserver } from "@/components/home/RevealObserver";

type MapRow = {
  id: string;
  title: string;
  root_word: string | null;
  updated_at: string;
};

export default async function HomePage() {
  const user = await getSession();
  let maps: MapRow[] = [];
  if (user) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("mindmaps")
      .select("id, title, root_word, updated_at")
      .order("updated_at", { ascending: false })
      .limit(12);
    maps = (data ?? []) as MapRow[];
  }

  return (
    <>
      <ScanOverlay scope="page" />
      <div style={{ position: "relative", zIndex: 2 }}>
        <HomeNav />
        {user && <MyMapsStrip maps={maps} />}
        <Hero loggedIn={!!user} />
        <HowItWorks />
        <Features />
        <CtaBand loggedIn={!!user} />
        <Footer />
      </div>
      <RevealObserver />
    </>
  );
}
