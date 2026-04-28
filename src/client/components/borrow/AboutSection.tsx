import React from "react";

export default function AboutSection() {
  return (
    <div id="about" className="min-h-screen w-full bg-[#050508] relative z-20 flex flex-col items-center justify-center py-20">
      <div className="flex flex-col items-center gap-5 text-center px-6 max-w-4xl">
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mt-5">
          Disc<b className="text-red-500">o</b>ver the world's fastest{" "}
          <b className="text-emerald-400">e</b>mergency network
        </h2>

        <div className="mt-6">
          <p className="text-white font-semibold text-lg">The unified safety platform begins—your life</p>
          <p className="text-zinc-500 mt-2 text-base max-w-2xl mx-auto">
            ResQ unites every user from countless buildings, streets, and smart cities into a unified Protective Layer.
          </p>
        </div>
      </div>

      <div className="w-full max-w-6xl mt-16 h-[60vh] relative overflow-hidden rounded-2xl mx-auto px-6">
        <img
          src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=2000&auto=format&fit=crop"
          alt="ResQ Background Layer"
          className="w-full h-full object-cover rounded-2xl"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-transparent to-transparent rounded-2xl" />
      </div>
    </div>
  );
}
