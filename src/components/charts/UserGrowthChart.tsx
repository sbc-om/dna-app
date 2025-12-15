'use client';

import { useEffect, useRef, useState } from 'react';
import { Users, TrendingUp, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DataPoint {
  date: string;
  users: number;
  label: string;
}

interface UserGrowthChartProps {
  locale?: string;
}

export function UserGrowthChart({ locale = 'en' }: UserGrowthChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredPoint, setHoveredPoint] = useState<DataPoint | null>(null);
  const [mounted, setMounted] = useState(false);

  // Generate realistic data for last 30 days
  const generateData = (): DataPoint[] => {
    const data: DataPoint[] = [];
    const today = new Date();
    const baseUsers = 50;
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Create smooth sinusoidal growth with upward trend
      const dayOfMonth = date.getDate();
      const sine = Math.sin((dayOfMonth * Math.PI) / 15) * 15;
      const growth = (29 - i) * 2.5; // Linear growth component
      const randomVariation = Math.random() * 8 - 4;
      
      const users = Math.round(baseUsers + growth + sine + randomVariation);
      
      data.push({
        date: date.toISOString().split('T')[0],
        users: Math.max(users, 0),
        label: date.toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', { 
          month: 'short', 
          day: 'numeric' 
        })
      });
    }
    
    return data;
  };

  const [data] = useState<DataPoint[]>(generateData());

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size with device pixel ratio for sharp rendering
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(38,38,38,0.65)';
    const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(38,38,38,0.08)';
    const lineColor = isDark ? 'rgba(255,255,255,0.85)' : 'rgba(38,38,38,0.9)';
    const fillColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(38,38,38,0.06)';

    // Calculate dimensions
    const padding = { top: 30, right: 30, bottom: 50, left: 50 };
    const chartWidth = rect.width - padding.left - padding.right;
    const chartHeight = rect.height - padding.top - padding.bottom;

    const maxUsers = Math.max(...data.map(d => d.users));
    const minUsers = Math.min(...data.map(d => d.users));
    const userRange = maxUsers - minUsers;

    // Draw grid lines
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + chartWidth, y);
      ctx.stroke();

      // Y-axis labels
      const value = maxUsers - (userRange / 5) * i;
      ctx.fillStyle = textColor;
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(Math.round(value).toString(), padding.left - 10, y + 4);
    }

    // Draw X-axis labels (every 5 days)
    ctx.fillStyle = textColor;
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    
    data.forEach((point, i) => {
      if (i % 5 === 0 || i === data.length - 1) {
        const x = padding.left + (chartWidth / (data.length - 1)) * i;
        ctx.fillText(point.label, x, rect.height - 20);
      }
    });

    // Draw smooth curve with area fill
    ctx.beginPath();
    
    // Start from bottom left
    const firstX = padding.left;
    const firstY = padding.top + chartHeight - ((data[0].users - minUsers) / userRange) * chartHeight;
    
    ctx.moveTo(firstX, padding.top + chartHeight);
    ctx.lineTo(firstX, firstY);

    // Draw smooth curve using cardinal spline
    for (let i = 0; i < data.length; i++) {
      const x = padding.left + (chartWidth / (data.length - 1)) * i;
      const y = padding.top + chartHeight - ((data[i].users - minUsers) / userRange) * chartHeight;
      
      if (i === 0) {
        ctx.lineTo(x, y);
      } else {
        // Calculate control points for smooth curve
        const prevX = padding.left + (chartWidth / (data.length - 1)) * (i - 1);
        const prevY = padding.top + chartHeight - ((data[i - 1].users - minUsers) / userRange) * chartHeight;
        
        const cpX1 = prevX + (x - prevX) / 3;
        const cpY1 = prevY;
        const cpX2 = prevX + 2 * (x - prevX) / 3;
        const cpY2 = y;
        
        ctx.bezierCurveTo(cpX1, cpY1, cpX2, cpY2, x, y);
      }
    }

    // Close path for fill
    const lastX = padding.left + chartWidth;
    ctx.lineTo(lastX, padding.top + chartHeight);
    ctx.closePath();

    // Fill area
    ctx.fillStyle = fillColor;
    ctx.fill();

    // Draw line on top
    ctx.beginPath();
    data.forEach((point, i) => {
      const x = padding.left + (chartWidth / (data.length - 1)) * i;
      const y = padding.top + chartHeight - ((point.users - minUsers) / userRange) * chartHeight;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        const prevX = padding.left + (chartWidth / (data.length - 1)) * (i - 1);
        const prevY = padding.top + chartHeight - ((data[i - 1].users - minUsers) / userRange) * chartHeight;
        
        const cpX1 = prevX + (x - prevX) / 3;
        const cpY1 = prevY;
        const cpX2 = prevX + 2 * (x - prevX) / 3;
        const cpY2 = y;
        
        ctx.bezierCurveTo(cpX1, cpY1, cpX2, cpY2, x, y);
      }
    });

    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw points
    data.forEach((point, i) => {
      const x = padding.left + (chartWidth / (data.length - 1)) * i;
      const y = padding.top + chartHeight - ((point.users - minUsers) / userRange) * chartHeight;

      // Inner circle
      ctx.beginPath();
      ctx.arc(x, y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = lineColor;
      ctx.fill();
      
      // White center
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = isDark ? '#0a0a0a' : '#ffffff';
      ctx.fill();
    });

    // Handle hover
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      let closestPoint: DataPoint | null = null;
      let minDistance = Infinity;

      data.forEach((point, i) => {
        const x = padding.left + (chartWidth / (data.length - 1)) * i;
        const y = padding.top + chartHeight - ((point.users - minUsers) / userRange) * chartHeight;
        const distance = Math.sqrt(Math.pow(mouseX - x, 2) + Math.pow(mouseY - y, 2));

        if (distance < 20 && distance < minDistance) {
          minDistance = distance;
          closestPoint = point;
        }
      });

      setHoveredPoint(closestPoint);
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', () => setHoveredPoint(null));

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', () => setHoveredPoint(null));
    };
  }, [mounted, data]);

  const totalUsers = data[data.length - 1].users;
  const growthRate = ((totalUsers - data[0].users) / data[0].users * 100).toFixed(1);

  return (
    <Card className="bg-white dark:bg-[#262626] border-2 border-[#DDDDDD] dark:border-[#000000]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-center">
              <Users className="h-6 w-6 text-gray-700 dark:text-gray-200" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                {locale === 'ar' ? 'نمو المستخدمين' : 'User Growth'}
              </CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                <Calendar className="h-3.5 w-3.5" />
                {locale === 'ar' ? 'آخر 30 يومًا' : 'Last 30 Days'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {totalUsers}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {locale === 'ar' ? 'إجمالي المستخدمين' : 'Total Users'}
              </p>
            </div>
            <div className="h-12 w-px bg-gray-200 dark:bg-gray-700" />
            <div className="text-right">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <p className="text-2xl font-bold text-green-500">
                  +{growthRate}%
                </p>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {locale === 'ar' ? 'نمو' : 'Growth'}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <div className="relative">
          <canvas
            ref={canvasRef}
            className="block w-full h-[300px] cursor-crosshair"
          />
          
          {/* Hover tooltip */}
          {hoveredPoint && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-gray-800 text-white px-4 py-2.5 rounded-xl border border-gray-700 animate-scale-in pointer-events-none">
              <div className="text-center">
                <p className="text-xs text-gray-400 mb-1">{hoveredPoint.label}</p>
                <p className="text-lg font-bold">{hoveredPoint.users} {locale === 'ar' ? 'مستخدمين' : 'users'}</p>
              </div>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full">
                <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-800" />
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-gray-900 dark:bg-gray-100" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {locale === 'ar' ? 'عدد المستخدمين' : 'User Count'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-0.5 w-6 bg-gray-900 dark:bg-gray-100" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {locale === 'ar' ? 'الاتجاه' : 'Trend'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
