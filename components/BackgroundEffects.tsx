import React, { useEffect, useRef } from 'react';
import { BackgroundEffectType } from '../types';

interface BackgroundEffectsProps {
  effect: BackgroundEffectType;
  speed: 'slow' | 'normal' | 'fast';
}

export const BackgroundEffects: React.FC<BackgroundEffectsProps> = ({ effect, speed }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Convert string speed to numeric multiplier
  const getSpeedMultiplier = () => {
    switch (speed) {
      case 'slow': return 0.5;
      case 'fast': return 2.0;
      case 'normal':
      default: return 1.0;
    }
  };

  useEffect(() => {
    if (effect === 'none' || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: any[] = [];
    
    // Set canvas size
    const resizeCanvas = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas(); // Initial size

    // Initialize particles based on effect
    const initParticles = () => {
      particles = [];
      // Adjust density based on screen width
      const density = window.innerWidth < 768 ? 0.5 : 1;
      
      if (effect === 'snow') {
        const count = 150 * density;
        for (let i = 0; i < count; i++) {
          particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: Math.random() * 3 + 1,
            speedY: Math.random() * 1 + 0.5,
            speedX: Math.random() * 1 - 0.5,
            opacity: Math.random() * 0.5 + 0.3
          });
        }
      } else if (effect === 'rain') {
        const count = 150 * density;
        for (let i = 0; i < count; i++) {
          particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            length: Math.random() * 20 + 10,
            speedY: Math.random() * 10 + 15,
            opacity: Math.random() * 0.4 + 0.1
          });
        }
      } else if (effect === 'embers') {
        const count = 60 * density;
        for (let i = 0; i < count; i++) {
          particles.push({
            x: Math.random() * canvas.width,
            y: canvas.height + Math.random() * 100,
            radius: Math.random() * 3 + 1,
            speedY: Math.random() * 2 + 1,
            speedX: Math.random() * 2 - 1,
            opacity: Math.random() * 0.8 + 0.2,
            // Store base RGB values to construct rgba string cleanly later
            colorR: Math.floor(200 + Math.random() * 55),
            colorG: Math.floor(Math.random() * 100),
            colorB: 0
          });
        }
      } else if (effect === 'matrix') {
         const columns = Math.floor(canvas.width / 20);
         for (let i = 0; i < columns; i++) {
           particles.push({
             x: i * 20,
             y: Math.random() * -canvas.height,
             speedY: Math.random() * 5 + 2,
             chars: '0123456789ABCDEF'
           });
         }
      } else if (effect === 'breathe') {
           particles.push({ phase: 0 });
      }
    };

    initParticles();

    const draw = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const speedMult = getSpeedMultiplier();

      if (effect === 'snow') {
        ctx.fillStyle = 'white';
        particles.forEach(p => {
          ctx.beginPath();
          ctx.globalAlpha = p.opacity;
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
          
          p.y += p.speedY * speedMult;
          p.x += p.speedX * speedMult;
          
          if (p.y > canvas.height) p.y = -10;
          if (p.x > canvas.width) p.x = 0;
          if (p.x < 0) p.x = canvas.width;
        });
      } 
      else if (effect === 'rain') {
        ctx.strokeStyle = '#a5b4fc';
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        particles.forEach(p => {
          ctx.beginPath();
          ctx.globalAlpha = p.opacity;
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x, p.y + p.length);
          ctx.stroke();
          
          p.y += p.speedY * speedMult;
          if (p.y > canvas.height) {
            p.y = -20;
            p.x = Math.random() * canvas.width;
          }
        });
      }
      else if (effect === 'embers') {
        particles.forEach(p => {
          ctx.beginPath();
          const fade = Math.max(0, p.y / canvas.height);
          // Construct explicit RGBA string
          ctx.fillStyle = `rgba(${p.colorR}, ${p.colorG}, ${p.colorB}, ${p.opacity * fade})`;
          ctx.globalAlpha = 1; // Alpha handled in fillStyle
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
          
          p.y -= p.speedY * speedMult;
          p.x += p.speedX * speedMult;
          
          if (p.y < -10) {
              p.y = canvas.height + 10;
              p.x = Math.random() * canvas.width;
          }
        });
      }
      else if (effect === 'matrix') {
          ctx.fillStyle = '#0F0';
          ctx.font = '15px monospace';
          particles.forEach(p => {
              const char = p.chars[Math.floor(Math.random() * p.chars.length)];
              ctx.globalAlpha = 0.6;
              ctx.fillText(char, p.x, p.y);
              
              p.y += p.speedY * speedMult;
              if (p.y > canvas.height) p.y = Math.random() * -100;
          });
      }
      else if (effect === 'breathe') {
          const p = particles[0];
          p.phase += 0.01 * speedMult; // Pulse speed
          const alpha = (Math.sin(p.phase) + 1) / 2 * 0.4; // 0 to 0.4
          ctx.fillStyle = `rgba(99, 102, 241, ${alpha})`;
          ctx.globalAlpha = 1;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [effect, speed]); // Re-run when effect or speed changes

  if (effect === 'none') return null;

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 pointer-events-none z-[5]" 
      style={{ mixBlendMode: effect === 'breathe' ? 'overlay' : 'normal' }}
    />
  );
};
