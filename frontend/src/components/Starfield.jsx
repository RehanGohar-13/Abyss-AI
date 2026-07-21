import { useEffect, useRef } from "react";

export default function Starfield({ isGalaxyMode }) {
  const canvasRef = useRef(null);
  const galaxyModeRef = useRef(isGalaxyMode);
  const opacityRef = useRef(isGalaxyMode ? 1 : 0);

  useEffect(() => {
    galaxyModeRef.current = isGalaxyMode;
  }, [isGalaxyMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let maxDist = Math.min(width, height) * 0.6;

    let galaxyCanvas = document.createElement("canvas");
    let bgStars = [];

    const generateGalaxyTexture = () => {
      galaxyCanvas.width = maxDist * 4;
      galaxyCanvas.height = maxDist * 4;
      const gCtx = galaxyCanvas.getContext("2d");
      const cx = galaxyCanvas.width / 2;
      const cy = galaxyCanvas.height / 2;

      // Crucial for the glowing nebula effect
      gCtx.globalCompositeOperation = "lighter";

      // Layer 1: Sparse Nebula Dust (Subtle blue/orange glows along arms)
      for (let i = 0; i < 80; i++) {
        const arm = Math.floor(Math.random() * 2);
        const r = Math.pow(Math.random(), 2) * maxDist * 1.5;
        const baseAngle = r * 0.012 + arm * Math.PI;
        const fuzz = Math.random() * 250 + 80;
        const angle = baseAngle + (Math.random() - 0.5) * (fuzz / (r + 1));

        const x = cx + Math.cos(angle) * r + (Math.random() - 0.5) * 50;
        const y = cy + Math.sin(angle) * r + (Math.random() - 0.5) * 50;
        const radius = Math.random() * 120 + 40;

        const dustGrad = gCtx.createRadialGradient(x, y, 0, x, y, radius);
        const colorChoice = Math.random();
        let color;
        if (colorChoice > 0.4)
          color = "80, 120, 255"; // Soft blue dust
        else color = "255, 180, 120"; // Warm orange dust near core

        // Very low opacity so the galaxy is mostly white/blue
        dustGrad.addColorStop(0, `rgba(${color}, 0.04)`);
        dustGrad.addColorStop(1, "rgba(0,0,0,0)");
        gCtx.fillStyle = dustGrad;
        gCtx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
      }

      // Layer 2: Massive Bright Core Glow (The yellow/white centerpiece)
      const coreGrad = gCtx.createRadialGradient(
        cx,
        cy,
        0,
        cx,
        cy,
        maxDist * 0.25,
      );
      coreGrad.addColorStop(0.0, "rgba(255, 250, 240, 1)"); // Pure white center
      coreGrad.addColorStop(0.2, "rgba(255, 240, 200, 0.9)"); // Yellow halo
      coreGrad.addColorStop(0.5, "rgba(255, 220, 150, 0.4)"); // Fading yellow
      coreGrad.addColorStop(0.8, "rgba(100, 150, 255, 0.1)"); // Soft blue outer glow
      coreGrad.addColorStop(1.0, "rgba(0,0,0,0)");
      gCtx.fillStyle = coreGrad;
      gCtx.fillRect(0, 0, galaxyCanvas.width, galaxyCanvas.height);

      // Layer 3: 50,000 Galaxy Stars
      for (let i = 0; i < 50000; i++) {
        const arm = Math.floor(Math.random() * 2);
        const r = Math.pow(Math.random(), 4) * maxDist * 1.5;
        const baseAngle = r * 0.012 + arm * Math.PI;
        const fuzz = Math.random() * (1 - r / (maxDist * 1.5)) * 250 + 30;
        const angle = baseAngle + (Math.random() - 0.5) * (fuzz / (r + 1));

        const x = cx + Math.cos(angle) * r + (Math.random() - 0.5) * 40;
        const y = cy + Math.sin(angle) * r + (Math.random() - 0.5) * 40;

        const size = Math.random() * 1.5 + 0.2;
        let color;
        const rand = Math.random();

        if (r < maxDist * 0.15)
          color = `rgba(255, 250, 220, ${0.9 + Math.random() * 0.1})`; // Bright core stars
        else if (rand > 0.96)
          color = `rgba(255, 80, 80, ${0.5 + Math.random() * 0.5})`; // Red giants
        else if (rand > 0.85)
          color = `rgba(150, 200, 255, ${0.5 + Math.random() * 0.5})`; // Blue giants
        else color = `rgba(255, 255, 255, ${0.3 + Math.random() * 0.7})`;

        gCtx.fillStyle = color;
        gCtx.fillRect(x, y, size, size);
      }
    };

    const generateBgStars = () => {
      bgStars = [];
      for (let i = 0; i < 800; i++) {
        bgStars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 1.2 + 0.2,
          opacity: Math.random() * 0.5 + 0.2,
          twinkleSpeed: Math.random() * 2 + 0.5,
          phase: Math.random() * Math.PI * 2,
        });
      }
    };

    generateGalaxyTexture();
    generateBgStars();

    let stars = Array.from({ length: 400 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      z: Math.random() * width,
      size: Math.random() * 1.5,
    }));

    let animationId;
    let galaxyRotation = 0;
    let time = 0;

    function animate() {
      time += 0.016;
      const targetOpacity = galaxyModeRef.current ? 1 : 0;
      opacityRef.current += (targetOpacity - opacityRef.current) * 0.04;
      const galaxyAlpha = opacityRef.current;
      const warpAlpha = 1 - galaxyAlpha;

      ctx.fillStyle = `rgba(0, 0, 0, ${0.2 + 0.8 * galaxyAlpha})`;
      ctx.fillRect(0, 0, width, height);

      if (warpAlpha > 0.01) {
        stars.forEach((s) => {
          s.z -= 4;
          if (s.z <= 0) {
            s.z = width;
            s.x = Math.random() * width;
            s.y = Math.random() * height;
          }
          const k = 128 / s.z;
          const px = s.x * k + (width / 2) * (1 - k);
          const py = s.y * k + (height / 2) * (1 - k);

          if (px >= 0 && px <= width && py >= 0 && py <= height) {
            const size = (1 - s.z / width) * s.size * 2;
            const opacity = (1 - s.z / width) * warpAlpha;
            ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
            ctx.fillRect(px, py, size, size);
          }
        });
      }

      if (galaxyAlpha > 0.01) {
        bgStars.forEach((s) => {
          const twinkle = Math.sin(time * s.twinkleSpeed + s.phase) * 0.3 + 0.7;
          ctx.fillStyle = `rgba(255, 255, 255, ${s.opacity * galaxyAlpha * twinkle})`;
          ctx.fillRect(s.x, s.y, s.size, s.size);
        });

        ctx.save();
        ctx.translate(width / 2, height / 2);
        ctx.globalAlpha = galaxyAlpha;

        // Subtle 3D tilt: 0.75 makes it a stretched ellipse, not a flat line
        ctx.scale(1, 0.75);
        ctx.rotate(galaxyRotation);

        ctx.drawImage(
          galaxyCanvas,
          -galaxyCanvas.width / 2,
          -galaxyCanvas.height / 2,
        );

        ctx.restore();

        galaxyRotation += 0.0005;
      }

      animationId = requestAnimationFrame(animate);
    }
    animate();

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      maxDist = Math.min(width, height) * 0.6;
      generateGalaxyTexture();
      generateBgStars();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full z-0" />
  );
}
