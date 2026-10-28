import { PageShell } from '@/components/layout/PageShell'
import SthanamHero from '@/components/home/SthanamHero'
import PilgrimJourney from '@/components/home/PilgrimJourney'
import HomeFooter from '@/components/home/HomeFooter'

export default function Landing() {
  return (
    <PageShell transparentOnHero={true} className="pb-20 lg:pb-0">
      {/* ----------------- 1. REDESIGNED SAGE-MIST HERO SECTION ----------------- */}
      <SthanamHero />

      {/* ----------------- 2. INTERACTIVE WELCOME TO NASHIK ROAD JOURNEY ----------------- */}
      <PilgrimJourney />

      {/* ----------------- 3. COMPACT HOME FOOTER ----------------- */}
      <HomeFooter />
    </PageShell>
  )
}


