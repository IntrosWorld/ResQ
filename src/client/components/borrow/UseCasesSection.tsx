import React from "react";
import { ArrowUpRight } from "lucide-react";

const useCases = [
  {
    title: "Fire Detection",
    video: "https://res.cloudinary.com/dbnnd43kl/video/upload/v1777321354/From_KlickPin_CF_Engine_55_57_Arrived___New_photo_download_Scammer_pictures_Real_life_video_-_Pin-1086141635137543474_uvuaig.mp4",
    href: "/city/fire",
  },
  {
    title: "Women Safety / Intrusion",
    video: "https://res.cloudinary.com/dbnnd43kl/video/upload/v1777326029/From_KlickPin_CF_Cultural_country_travel_ideas_with_charm_and_ideas_for_creative_people_with_beautiful_world_vibes_-_Pin-1010284128880072370_pvdceh.mp4",
    href: "/city/security",
  },
  {
    title: "Medical Emergency / Ambulance",
    video: "https://res.cloudinary.com/dbnnd43kl/video/upload/v1777328146/InShot_20260428_033847194_xztkcr.mp4",
    href: "/city/medical",
  },
  {
    title: "Disaster Management",
    video: "https://res.cloudinary.com/dbnnd43kl/video/upload/v1777328842/From_KlickPin_CF_Pin_on_Cars_uiuosw.mp4",
    href: "/city/disaster",
  },
  {
    title: "Smart CCTV City Monitoring",
    video: "https://res.cloudinary.com/dbnnd43kl/video/upload/v1777328191/InShot_20260428_032211050_zpqghw.mp4",
    href: "/city/cctv",
  },
  {
    title: "Unified Command Center",
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2000&auto=format&fit=crop",
    href: "/city/unified",
  },
];

interface UseCasesSectionProps {
  onNavigate: (path: string) => void;
}

export default function UseCasesSection({ onNavigate }: UseCasesSectionProps) {
  return (
    <section className="bg-white w-full" id="dashboards">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-1 bg-white p-1">
        {useCases.map((useCase, index) => (
          <button
            key={index}
            onClick={() => onNavigate(useCase.href)}
            className="group relative h-[60vh] md:h-[70vh] w-full overflow-hidden flex flex-col justify-end p-8 md:p-12 block"
          >
            <div className="absolute inset-0 z-0">
              {useCase.video ? (
                <video
                  src={useCase.video}
                  autoPlay muted loop playsInline
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <img
                  src={useCase.image}
                  alt={useCase.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black/90" />
            </div>

            <div className="relative z-10 max-w-2xl transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
              <h2 className="text-4xl md:text-5xl lg:text-[3.5rem] text-white leading-[1.1] tracking-tight mb-8">
                {useCase.title}
              </h2>
              <span className="flex items-center gap-3 px-6 py-3 border border-white/30 rounded-md text-white font-medium text-sm hover:bg-white/10 hover:border-white transition-all backdrop-blur-sm pointer-events-none w-fit">
                See Dashboard
                <ArrowUpRight className="size-4" />
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
