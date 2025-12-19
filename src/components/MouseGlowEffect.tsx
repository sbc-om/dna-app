'use client';

import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export function MouseGlowEffect() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [isActive, setIsActive] = useState(false);
  const [glowColor, setGlowColor] = useState({ r: 59, g: 130, b: 246 }); // Default blue

  // Very smooth spring animation for natural movement
  const springConfig = { damping: 40, stiffness: 100 };
  const glowX = useSpring(mouseX, springConfig);
  const glowY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      setIsActive(true);

      // Detect element under mouse and change color based on it
      const element = document.elementFromPoint(e.clientX, e.clientY);
      if (element) {
        const computedStyle = window.getComputedStyle(element);
        const bgColor = computedStyle.backgroundColor;
        const textColor = computedStyle.color;
        
        // Extract colors and determine glow color
        const extractRGB = (color: string) => {
          const match = color.match(/\d+/g);
          if (match && match.length >= 3) {
            return {
              r: parseInt(match[0]),
              g: parseInt(match[1]),
              b: parseInt(match[2])
            };
          }
          return null;
        };

        const bg = extractRGB(bgColor);
        const text = extractRGB(textColor);

        // Determine glow color based on element's colors
        if (bg && (bg.r + bg.g + bg.b) < 100) {
          // Dark background - use brighter colors
          if (text && text.b > 200) {
            setGlowColor({ r: 96, g: 165, b: 250 }); // Lighter blue
          } else if (text && text.r > 200) {
            setGlowColor({ r: 244, g: 114, b: 182 }); // Pink
          } else {
            setGlowColor({ r: 168, g: 85, b: 247 }); // Purple
          }
        } else if (bg && bg.b > 200) {
          // Blue background
          setGlowColor({ r: 236, g: 72, b: 153 }); // Pink contrast
        } else if (bg && bg.r > 200 && bg.g < 150) {
          // Red/Pink background
          setGlowColor({ r: 59, g: 130, b: 246 }); // Blue contrast
        } else if (bg && bg.g > 200) {
          // Green background
          setGlowColor({ r: 147, g: 51, b: 234 }); // Purple contrast
        } else {
          // Light background - subtle blue
          setGlowColor({ r: 59, g: 130, b: 246 });
        }
      }
    };

    const handleMouseLeave = () => {
      setIsActive(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.body.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.body.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [mouseX, mouseY]);

  if (!isActive) return null;

  const { r, g, b } = glowColor;

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* Outer subtle glow - Very soft */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full blur-[100px]"
        style={{
          left: glowX,
          top: glowY,
          x: '-50%',
          y: '-50%',
          background: `radial-gradient(circle, rgba(${r}, ${g}, ${b}, 0.08) 0%, rgba(${r}, ${g}, ${b}, 0.04) 50%, transparent 80%)`,
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.6, 0.8, 0.6],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      {/* Medium glow with complementary color */}
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full blur-[80px]"
        style={{
          left: glowX,
          top: glowY,
          x: '-50%',
          y: '-50%',
          background: `radial-gradient(circle, rgba(${Math.min(255, r + 50)}, ${Math.max(0, g - 30)}, ${Math.min(255, b + 50)}, 0.06) 0%, rgba(${r}, ${g}, ${b}, 0.03) 60%, transparent 85%)`,
        }}
        animate={{
          scale: [1, 1.15, 1],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* Inner core glow - Very subtle */}
      <motion.div
        className="absolute w-[250px] h-[250px] rounded-full blur-[60px]"
        style={{
          left: glowX,
          top: glowY,
          x: '-50%',
          y: '-50%',
          background: `radial-gradient(circle, rgba(${r}, ${g}, ${b}, 0.1) 0%, rgba(${r}, ${g}, ${b}, 0.05) 50%, transparent 80%)`,
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.7, 0.9, 0.7],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Accent sparkle - Very faint */}
      <motion.div
        className="absolute w-[100px] h-[100px] rounded-full blur-[40px]"
        style={{
          left: glowX,
          top: glowY,
          x: '-50%',
          y: '-50%',
          background: `radial-gradient(circle, rgba(255, 255, 255, 0.05) 0%, rgba(${r}, ${g}, ${b}, 0.08) 40%, transparent 70%)`,
        }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
}
