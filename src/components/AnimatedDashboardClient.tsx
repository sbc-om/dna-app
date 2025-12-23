'use client';

import { motion } from 'framer-motion';
import { AnimatedStatCard } from './AnimatedStatCard';
import { Users, Calendar, Clock, CheckCircle, UserCheck, User, GraduationCap, TrendingUp, Award } from 'lucide-react';
import { Dictionary } from '@/lib/i18n/getDictionary';

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalCourses: number;
  activeCourses: number;
  totalEnrollments: number;
  paidEnrollments: number;
  totalCoaches: number;
  totalKids: number;
}

interface AnimatedDashboardClientProps {
  stats: AdminStats;
  dictionary: Dictionary;
  username: string;
  roleLabel: string;
}

export function AnimatedDashboardClient({ 
  stats, 
  dictionary,
  username,
  roleLabel 
}: AnimatedDashboardClientProps) {
  return (
    <div className="space-y-8">
      {/* Animated Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, type: 'spring' }}
        className="relative"
      >
        <div className="absolute inset-0 bg-linear-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 rounded-3xl blur-3xl" />
        <div className="relative bg-linear-to-br from-white/80 to-white/60 dark:from-gray-900/80 dark:to-gray-800/60 backdrop-blur-xl p-8 rounded-3xl border-2 border-white/20 dark:border-white/10 shadow-2xl">
          <motion.h1 
            className="text-4xl md:text-5xl font-bold mb-3"
            animate={{ 
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{ duration: 5, repeat: Infinity }}
            style={{
              background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899, #3b82f6)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {dictionary.common.welcome} {username}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-lg font-semibold text-gray-700 dark:text-gray-300"
          >
            {dictionary.users.role}: <span className="text-blue-600 dark:text-blue-400">{roleLabel}</span>
          </motion.p>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatedStatCard
          title={dictionary.dashboard.totalUsers}
          value={stats.totalUsers}
          icon={Users}
          gradient="bg-linear-to-br from-blue-500 to-blue-600"
          delay={0}
        />
        
        <AnimatedStatCard
          title={dictionary.dashboard.activeUsers}
          value={stats.activeUsers}
          icon={UserCheck}
          gradient="bg-linear-to-br from-green-500 to-emerald-600"
          delay={0.1}
        />
        
        <AnimatedStatCard
          title={dictionary.dashboard.totalCourses || 'Total Courses'}
          value={stats.totalCourses}
          subtitle={`${stats.activeCourses} ${dictionary.users.active || 'active'}`}
          icon={GraduationCap}
          gradient="bg-linear-to-br from-indigo-500 to-purple-600"
          delay={0.2}
        />
        
        <AnimatedStatCard
          title={dictionary.dashboard.totalEnrollments || 'Total Enrollments'}
          value={stats.totalEnrollments}
          subtitle={`${stats.paidEnrollments} ${dictionary.payments?.paid || 'paid'}`}
          icon={TrendingUp}
          gradient="bg-linear-to-br from-pink-500 to-rose-600"
          delay={0.3}
        />
        
        <AnimatedStatCard
          title={dictionary.dashboard.totalCoaches || 'Total Coaches'}
          value={stats.totalCoaches}
          icon={Award}
          gradient="bg-linear-to-br from-violet-500 to-purple-600"
          delay={0.4}
        />
        
        <AnimatedStatCard
          title={dictionary.dashboard.totalKids || 'Total Kids'}
          value={stats.totalKids}
          icon={User}
          gradient="bg-linear-to-br from-teal-500 to-cyan-600"
          delay={0.5}
        />
      </div>
    </div>
  );
}
