import React from "react";
import { motion } from "framer-motion";
import { Shield, Building2, Brain, Crosshair, Users, Activity, Command } from "lucide-react";

const sections = [
  { title: "Intelligence That Acts Instantly", description: "Our AI workforce continuously monitors CCTV, fire systems, panic alerts, and crowd behavior to detect threats early and reduce false alarms.", icon: Brain, color: "text-red-500", bg: "bg-red-500/10" },
  { title: "From Detection to Action", description: "Not just alerts—automated dispatch, evacuation guidance, responder routing, and unified communication.", icon: Command, color: "text-blue-500", bg: "bg-blue-500/10" },
  { title: "One View of Every Incident", description: "See what happened, where it happened, who needs help, and who is responding—all in one platform.", icon: Crosshair, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { title: "Designed for Modern Safety Teams", description: "Security staff, admins, responders, and citizens operate through role-based dashboards tailored for rapid decisions and coordinated action.", icon: Users, color: "text-purple-500", bg: "bg-purple-500/10" },
];

const highlights = [
  "See Threats. Verify Fast. Respond Smarter.",
  "One Platform for Every Emergency.",
  "From Alert to Rescue in Seconds.",
  "Intelligence That Protects People.",
  "Safety Infrastructure for the Modern World.",
];

export default function ProactiveOperationsSection() {
  return (
    <section className="bg-[#050508] py-32 px-6 md:px-12 relative overflow-hidden border-t border-white/5">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-[1400px] mx-auto relative z-10">
        <div className="text-center max-w-4xl mx-auto mb-32">
          <span className="text-red-500 font-bold tracking-widest uppercase text-sm mb-4 block">Proactive, autonomous operations</span>
          <h2 className="text-4xl md:text-6xl font-bold text-white leading-[1.1] tracking-tight mb-8">
            Optimized for Saving Lives
          </h2>
          <p className="text-xl md:text-2xl text-zinc-400 font-medium leading-relaxed mb-8">
            Our emergency intelligence platform becomes an embedded safety layer across hotels, campuses, hospitals, and smart cities—focused on faster response, stronger coordination, and real-world protection.
          </p>
          <p className="text-lg text-zinc-500">
            Powered by AI detection, real-time alerts, live mapping, and connected responders that deliver measurable emergency outcomes when every second matters.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-32">
          {sections.map((sec, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="bg-[#0f0f15]/80 border border-white/5 p-10 rounded-3xl hover:bg-[#1a1a24] transition-all group"
            >
              <div className={`size-14 rounded-2xl ${sec.bg} border border-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <sec.icon className={`size-7 ${sec.color}`} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">{sec.title}</h3>
              <p className="text-zinc-400 leading-relaxed text-lg">{sec.description}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-32">
          {[
            { icon: Building2, color: "text-blue-500", title: "Built for Critical Scale", text: "Designed for large facilities and city-wide operations, our infrastructure handles thousands of sensors, camera feeds, user alerts, and response events reliably in real time." },
            { icon: Shield, color: "text-emerald-500", title: "Trusted Under Pressure", text: "Every alert, decision, and responder action is trackable, observable, and explainable—ensuring accountability during emergencies. When seconds matter, systems must work." },
            { icon: Activity, color: "text-red-500", title: "Built to Reduce Chaos", text: "Lower response times, prevent escalation, improve evacuation speed, and protect lives. Prepared for any scenario: Fire, medical, intrusion, crowd panic. One platform handles all." },
          ].map((item, i) => (
            <div key={i}>
              <div className="flex items-center gap-3 mb-6">
                <item.icon className={`${item.color} size-6`} />
                <h3 className="text-2xl font-bold text-white">{item.title}</h3>
              </div>
              <p className="text-zinc-400 leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
          className="bg-gradient-to-r from-red-900/20 via-black to-blue-900/20 border border-white/10 rounded-3xl p-12 text-center"
        >
          <h3 className="text-3xl font-bold text-white mb-10 tracking-tight">Intelligence That Protects People.</h3>
          <div className="flex flex-wrap justify-center gap-4">
            {highlights.map((tag, i) => (
              <span key={i} className="px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-zinc-300 hover:text-white transition-colors cursor-default">
                {tag}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
