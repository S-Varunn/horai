import React, { useEffect, useRef } from "react";
import { useTheme } from "@/hooks/use-theme";
import { particlesJS, destroyParticles } from "@/lib/particles";

export function ThemeParticles() {
  const { resolvedTheme } = useTheme();
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    destroyParticles();

    const isDark = resolvedTheme === "dark";
    const themeColor = isDark ? "#15c2c5" : "#0f8b8d";

    particlesJS("particles-js", {
      particles: {
        number: {
          value: 85,
          density: {
            enable: true,
            value_area: 800,
          },
        },
        color: {
          value: themeColor,
        },
        shape: {
          type: "circle",
        },
        opacity: {
          value: isDark ? 0.6 : 0.4,
          random: false,
        },
        size: {
          value: 3,
          random: true,
        },
        line_linked: {
          enable: true,
          distance: 140,
          color: themeColor,
          opacity: isDark ? 0.4 : 0.25,
          width: 1,
        },
        move: {
          enable: true,
          speed: 2,
          direction: "none",
          random: false,
          straight: false,
          out_mode: "out",
          bounce: false,
        },
      },
      interactivity: {
        detect_on: "canvas",
        events: {
          onhover: {
            enable: true,
            mode: "grab",
          },
          onclick: {
            enable: true,
            mode: "push",
          },
          resize: true,
        },
        modes: {
          grab: {
            distance: 150,
            line_linked: {
              opacity: 0.8,
            },
          },
          push: {
            particles_nb: 4,
          },
        },
      },
      retina_detect: true,
    });

    return () => {
      destroyParticles();
    };
  }, [resolvedTheme]);

  return (
    <div
      ref={containerRef}
      id="particles-js"
      className="fixed inset-0 w-screen h-screen pointer-events-none z-0 overflow-hidden"
    />
  );
}
