import { useEffect, useRef } from "react";

export default function Starfield() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    let stars = Array.from({ length: 400 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      z: Math.random() * width,
      size: Math.random() * 1.5,
    }));

    let shootingStars = [];

    function addShootingStar() {
      shootingStars.push({
        x: Math.random() * width,
        y: Math.random() * height * 0.5,
        len: Math.random() * 80 + 20,
        speed: Math.random() * 10 + 6,
        angle: Math.PI / 4.5,
        life: 1,
      });
    }

    let animationId;

    function animate() {
      ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
      ctx.fillRect(0, 0, width, height);

      stars.forEach((s) => {
        s.z -= 2;
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
          const opacity = 1 - s.z / width;
          ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
          ctx.fillRect(px, py, size, size);
        }
      });

      if (Math.random() < 0.008) addShootingStar();

      shootingStars = shootingStars.filter((ss) => {
        ss.x += ss.speed * Math.cos(ss.angle);
        ss.y += ss.speed * Math.sin(ss.angle);
        ss.life -= 0.015;

        if (ss.life > 0) {
          const tailX = ss.x - ss.len * Math.cos(ss.angle);
          const tailY = ss.y - ss.len * Math.sin(ss.angle);
          const gradient = ctx.createLinearGradient(ss.x, ss.y, tailX, tailY);
          gradient.addColorStop(0, `rgba(196, 181, 253, ${ss.life})`);
          gradient.addColorStop(1, "rgba(196, 181, 253, 0)");
          ctx.strokeStyle = gradient;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(ss.x, ss.y);
          ctx.lineTo(tailX, tailY);
          ctx.stroke();
          return true;
        }
        return false;
      });

      animationId = requestAnimationFrame(animate);
    }
    animate();

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
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
