import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import React from 'react';

gsap.registerPlugin(ScrollTrigger);

const splitToSpans = (text: string, className: string) => {
  return text.split(" ").map((word, i) => (
    <span key={i} className={`inline-block mr-[1vw] ${className}`}>
      {word}
    </span>
  ));
};

const MessageSection = () => {
  useGSAP(() => {
    gsap.to(".first-word", {
      color: "#b01c1cff",
      ease: "power1.in",
      stagger: 1,
      scrollTrigger: {
        trigger: ".message-content",
        start: "top center",
        end: "30% center",
        scrub: true,
      },
    });

    gsap.to(".sec-word", {
      color: "#b01c1cff",
      ease: "power1.in",
      stagger: 1,
      scrollTrigger: {
        trigger: ".second-message-wrapper",
        start: "top center",
        end: "bottom center",
        scrub: true,
      },
    });

    const revealTl = gsap.timeline({
      delay: 1,
      scrollTrigger: {
        trigger: ".msg-text-scroll",
        start: "top 60%",
      },
    });
    revealTl.to(".msg-text-scroll", {
      duration: 1,
      clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
      ease: "circ.inOut",
    });

    const paragraphTl = gsap.timeline({
      scrollTrigger: {
        trigger: ".message-content p",
        start: "top center",
      },
    });
    paragraphTl.from(".para-word", {
      yPercent: 300,
      rotate: 3,
      ease: "power1.inOut",
      duration: 1,
      stagger: 0.01,
    });
  });

  return (
    <section className="message-content">
      <div className="container mx-auto flex-center py-28 relative">
        <div className="w-full h-full">
          <div className="msg-wrapper">
            <h1 className="first-message-wrapper text-white/10">
              {splitToSpans("AI detecting risks before they escalate.", "first-word")}
            </h1>

            <div
              style={{ clipPath: "polygon(0 0, 0 0, 0 100%, 0% 100%)" }}
              className="msg-text-scroll"
            >
              <div className="bg-white md:pb-5 pb-3 px-5">
                <h2 className="text-black font-bold">→ Faster Alerts. Smarter Response. Safer Outcomes.</h2>
              </div>
            </div>

            <h1 className="second-message-wrapper text-white/10">
              {splitToSpans("Unified dashboard with real-time insights.", "sec-word")}
            </h1>
          </div>

          <div className="flex-center md:mt-20 mt-10">
            <div className="max-w-md px-10 flex-center overflow-hidden">
              <p className="flex flex-wrap justify-center overflow-hidden text-zinc-400">
                {"Seamless coordination across teams.".split(" ").map((w, i) => (
                  <span key={i} className="para-word inline-block mr-1">{w}</span>
                ))}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MessageSection;
