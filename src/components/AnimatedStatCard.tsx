'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { useState } from 'react';

interface AnimatedStatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  gradient: string;
  delay?: number;
}

export function AnimatedStatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  gradient,
  delay = 0 
}: AnimatedStatCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        delay, 
        type: 'spring', 
        stiffness: 260, 
        damping: 20 
      }}
      whileHover={{ 
        y: -5,
        rotateX: 5,
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative group cursor-pointer"
      style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}
    >
      {/* Glow effect on hover */}
      <motion.div
        className={`absolute inset-0 rounded-2xl blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-500 ${gradient}`}
        animate={isHovered ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      />
      
      {/* Card */}
      <div className="relative bg-gradient-to-br from-white/10 to-white/5 dark:from-gray-900/50 dark:to-gray-800/30 backdrop-blur-xl p-6 rounded-2xl border-2 border-white/20 dark:border-white/10 overflow-hidden h-full flex flex-col">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-5">
          <motion.div
            className={`w-full h-full ${gradient}`}
            animate={{ 
              backgroundPosition: ['0% 0%', '100% 100%'],
            }}
            transition={{ 
              duration: 20, 
              repeat: Infinity, 
              repeatType: 'reverse' 
            }}
            style={{ backgroundSize: '200% 200%' }}
          />
        </div>

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex-1">
            <motion.p 
              className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2"
              animate={isHovered ? { x: [0, 5, 0] } : {}}
              transition={{ duration: 0.5 }}
            >
              {title}
            </motion.p>
            <motion.p 
              className="text-4xl font-bold bg-gradient-to-br from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent"
              animate={isHovered ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.5 }}
            >
              {value}
            </motion.p>
            {subtitle && (
              <motion.p 
                className="text-xs text-gray-500 dark:text-gray-400 mt-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: delay + 0.2 }}
              >
                {subtitle}
              </motion.p>
            )}
          </div>

          {/* Animated icon */}
          <motion.div 
            className={`relative p-4 rounded-2xl ${gradient} shadow-lg`}
            animate={isHovered ? { 
              rotate: [0, -10, 10, -10, 0],
              scale: [1, 1.1, 1]
            } : {}}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              animate={isHovered ? { 
                rotate: 360,
              } : {}}
              transition={{ duration: 1, ease: "easeInOut" }}
            >
              <Icon className="w-8 h-8 text-white drop-shadow-lg" />
            </motion.div>
            
            {/* Icon glow */}
            <motion.div
              className={`absolute inset-0 rounded-2xl ${gradient} blur-md opacity-50`}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>
        </div>

        {/* Particle effects on hover */}
        {isHovered && (
          <>
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className={`absolute w-1 h-1 rounded-full ${gradient}`}
                initial={{ 
                  x: Math.random() * 100 + '%',
                  y: Math.random() * 100 + '%',
                  scale: 0 
                }}
                animate={{ 
                  y: '-100%',
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0]
                }}
                transition={{ 
                  duration: 2,
                  delay: i * 0.2,
                  repeat: Infinity 
                }}
              />
            ))}
          </>
        )}
      </div>
    </motion.div>
  );
}
