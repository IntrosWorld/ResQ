import React from "react";
import { motion } from "framer-motion";
import { Users, Video, BrainCircuit, Layers, Server } from "lucide-react";

const features = [
  {
    icon: Users,
    title: "How it helps local people",
    description: "For a resident, student, or anyone nearby, the value is simple: one tap creates a trusted alert stream. Report danger, share live location, and notify responders instantly. The system pushes safe-route guidance and maps nearby staff availability without needing to know who to call first.",
  },
  {
    icon: Video,
    title: "Connecting Existing CCTV",
    description: "CCTV does not get replaced. It gets connected. We ingest frames from existing cameras, run YOLO to detect fire, smoke, crowd panic, or intrusion, and merge them with manual user reports and sensor alarms onto one live command-and-response dashboard.",
  },
  {
    icon: BrainCircuit,
    title: "Zero False Alarms",
    description: "A false claim shouldn't become a full emergency. We risk-score every incident using multiple signals: YOLO video confidence, heat/smoke sensor confirmation, and location consistency. If a user reports a fire but YOLO and sensors see nothing, it's flagged as unverified until confirmed.",
  },
];

const layers = [
  { name: "Detection", text: "YOLO + sensors + manual reports combination." },
  { name: "Verification", text: "Cross-checking signals to reduce false alarms." },
  { name: "Coordination", text: "Staff, responders, and emergency services sync." },
  { name: "Localized Assistance", text: "Routing who is near, who can help, and where to go." },
];

const architecture = [
  { layer: "Edge Layer", detail: "YOLO runs on camera feeds near the site. Only detections go to the backend." },
  { layer: "Backend Event Layer", detail: "One service receives alerts via queues to handle massive incident volume." },
  { layer: "Real-time Layer", detail: "WebSockets stream live map updates and alert status to dashboards." },
  { layer: "Data Layer", detail: "Stores incident logs, indexed floor plans, and spatial routing data." },
  { layer: "Policy Layer", detail: "Multi-role RBAC for guests, staff, admins, and local responders." },
];

export default function PlatformFeaturesSection() {
  return (
    <section className="bg-black py-32 px-6 md:px-12 relative overflow-hidden border-t border-white/5 z-20">
      <div className="absolute top-1/4 left-0 w-[40rem] h-[40rem] bg-red-600/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-[40rem] h-[40rem] bg-blue-600/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-[1400px] mx-auto relative z-10">
        <div className="max-w-3xl mb-24">
          <span className="text-red-500 font-bold tracking-widest uppercase text-sm mb-4 block">The ResQ Architecture</span>
          <h2 className="text-4xl md:text-6xl font-bold text-white leading-[1.1] tracking-tight mb-6">
            A real-time incident intelligence platform for immediate local response.
          </h2>
          <p className="text-xl text-zinc-400 font-medium">
            You are building a trust layer for emergencies. <br />
            <span className="text-white">CCTV sees. YOLO interprets. Users report. The system verifies. Staff respond. Emergency services get a clean packet.</span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
          {features.map((feat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="bg-[#0f0f15]/50 border border-white/5 rounded-3xl p-8 backdrop-blur-sm hover:bg-[#1a1a24]/50 transition-colors"
            >
              <div className="size-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                <feat.icon className="size-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">{feat.title}</h3>
              <p className="text-zinc-400 leading-relaxed text-sm">{feat.description}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <div className="flex items-center gap-3 mb-8">
              <Layers className="text-red-500 size-6" />
              <h3 className="text-3xl font-bold text-white">4-Layer Uniqueness</h3>
            </div>
            <p className="text-zinc-400 mb-8 max-w-md">Our unparalleled strength lies in the synchronized combination of these core pillars, making it vastly superior to normal CCTV or SOS apps.</p>
            <div className="space-y-4">
              {layers.map((l, i) => (
                <div key={i} className="flex flex-col p-5 rounded-2xl bg-white/5 border border-white/5">
                  <span className="font-bold text-white text-lg mb-1">{l.name}</span>
                  <span className="text-sm text-zinc-400">{l.text}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <div className="flex items-center gap-3 mb-8">
              <Server className="text-blue-500 size-6" />
              <h3 className="text-3xl font-bold text-white">How We Scale</h3>
            </div>
            <p className="text-zinc-400 mb-8 max-w-md">Built in decoupled layers to flawlessly transition from monitoring a single building to safeguarding massive urban networks.</p>
            <div className="relative border-l border-white/10 ml-4 space-y-8 pb-4">
              {architecture.map((arc, i) => (
                <div key={i} className="relative pl-8">
                  <span className="absolute -left-[5px] top-1.5 size-2.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                  <h4 className="text-white font-bold mb-1.5">{arc.layer}</h4>
                  <p className="text-sm text-zinc-400 leading-snug">{arc.detail}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
