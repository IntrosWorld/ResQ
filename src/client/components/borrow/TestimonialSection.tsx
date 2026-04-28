import React, { useRef } from "react";

const cards = [
  {
    src: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    name: "Madison",
    img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop",
    incident: "Factory Fire Outbreak",
    desc: "YOLO detected smoke, thermal sensors confirmed heat spikes. ResQ verified the threat and mapped an evacuation route.",
    location: "Industrial Sector 7",
    time: "14:32 PM",
  },
  {
    src: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    name: "Alexander",
    img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=200&auto=format&fit=crop",
    incident: "Women Safety Distress",
    desc: "A mobile distress alert was triggered. ResQ immediately pushed safe-route guidance and routed nearby staff to intercept.",
    location: "University Campus East",
    time: "09:15 AM",
  },
  {
    src: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    name: "Andrew",
    img: "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?q=80&w=200&auto=format&fit=crop",
    incident: "Unverified False Alarm",
    desc: "A panic report occurred, but YOLO & sensors confirmed no anomalies. ResQ held it in low confidence, preventing a false escalation.",
    location: "Logistics Hub 2",
    time: "02:40 AM",
  },
  {
    src: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    name: "Bryan",
    img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop",
    incident: "Medical Emergency",
    desc: "A student collapsed. CCTV flagged unusual posture, linking with the emergency dashboard to alert on-site paramedics.",
    location: "Library Wing B",
    time: "11:20 AM",
  },
  {
    src: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
    name: "Chris",
    img: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=200&auto=format&fit=crop",
    incident: "Crowd Panic Escalation",
    desc: "YOLO tracked erratic crowding patterns. Security teams received a 5-minute early warning to intervene and de-escalate.",
    location: "City Square Events",
    time: "21:05 PM",
  },
  {
    src: "https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    name: "Devante",
    img: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=200&auto=format&fit=crop",
    incident: "Perimeter Intrusion",
    desc: "Multiple perimeter breaches were handled simultaneously. ResQ locked down sector access automatically.",
    location: "Chemical Plant Alpha",
    time: "03:10 AM",
  },
];

export default function TestimonialSection() {
  const vdRefs = useRef<(HTMLVideoElement | null)[]>([]);

  return (
    <section className="bg-[#050508] py-24 px-6 md:px-12 overflow-hidden relative">
      <div className="text-center mb-16">
        <h1 className="text-5xl md:text-7xl font-bold text-white leading-none tracking-tighter">
          Real <span className="text-red-500">Rescue</span> Stories
        </h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-[1400px] mx-auto">
        {cards.map((card, index) => (
          <div
            key={index}
            className="relative h-[400px] overflow-hidden rounded-2xl group cursor-pointer"
            onMouseEnter={() => vdRefs.current[index]?.play()}
            onMouseLeave={() => vdRefs.current[index]?.pause()}
          >
            <video
              ref={(el) => { vdRefs.current[index] = el; }}
              src={card.src}
              playsInline muted loop
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            <div className="absolute bottom-4 left-4 right-4 z-20 bg-black/45 backdrop-blur-md p-4 rounded-2xl border border-white/20">
              <div className="flex items-start gap-4 mb-3">
                <img src={card.img} alt={card.name} className="w-12 h-12 rounded-full object-cover border-2 border-red-500/50" />
                <div>
                  <p className="text-red-400 text-[10px] font-bold uppercase tracking-widest mb-0.5">Incident Survivor: {card.name}</p>
                  <h3 className="text-white font-bold text-sm leading-tight">{card.incident}</h3>
                </div>
              </div>
              <p className="text-gray-200 text-sm mt-1 leading-snug">{card.desc}</p>
              <div className="mt-3 flex items-center justify-between text-xs text-gray-300">
                <span>{card.location}</span>
                <span>{card.time}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
