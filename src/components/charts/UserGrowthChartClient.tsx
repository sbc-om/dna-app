'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp, Calendar, Loader2 } from 'lucide-react';

interface UserGrowthChartProps {
  locale: string;
}

interface DataPoint {
  date: string;
  users: number;
  label: string;
}

interface Stats {
  totalUsers: number;
  growthCount: number;
  growthRate: number;
}

export function UserGrowthChartClient({ locale }: UserGrowthChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [hoveredPoint, setHoveredPoint] = useState<DataPoint | null>(null);
  const [data, setData] = useState<DataPoint[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isRTL = locale === 'ar';

  // Fetch real data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/analytics/user-growth');
        
        if (!response.ok) {
          throw new Error('Failed to fetch user growth data');
        }
        
        const result = await response.json();
        
        // Transform data with labels
        const transformedData = result.data.map((point: { date: string; users: number }) => ({
          ...point,
          label: new Date(point.date).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
            month: 'short',
            day: 'numeric',
          }),
        }));
        
        setData(transformedData);
        setStats(result.stats);
      } catch (error) {
        console.error('Error fetching user growth data:', error);
        // Set empty data on error
        setData([]);
        setStats({ totalUsers: 0, growthCount: 0, growthRate: 0 });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [locale]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

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

    // Calculate dimensions
    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    const chartWidth = rect.width - padding.left - padding.right;
    const chartHeight = rect.height - padding.top - padding.bottom;

    // Find min and max values
    const maxUsers = Math.max(...data.map((d) => d.users));
    const minUsers = Math.min(...data.map((d) => d.users));
    const userRange = maxUsers - minUsers;

    // Draw grid lines
    ctx.strokeStyle = getComputedStyle(document.documentElement)
      .getPropertyValue('--grid-color')
      .trim() || '#e5e7eb';
    ctx.lineWidth = 1;

    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + chartWidth, y);
      ctx.stroke();

      // Draw Y-axis labels
      const value = Math.round(maxUsers - (userRange / 5) * i);
      ctx.fillStyle = getComputedStyle(document.documentElement)
        .getPropertyValue('--text-secondary')
        .trim() || '#6b7280';
      ctx.font = '12px system-ui';
      ctx.textAlign = 'right';
      ctx.fillText(value.toString(), padding.left - 10, y + 4);
    }

    // Draw X-axis labels (every 5 days)
    ctx.textAlign = 'center';
    for (let i = 0; i < data.length; i += 5) {
      const x = padding.left + (chartWidth / (data.length - 1)) * i;
      ctx.fillText(data[i].label, x, rect.height - 15);
    }

    // Draw smooth sinusoidal curve using Bézier curves
    const isDark = document.documentElement.classList.contains('dark');
    const lineColor = isDark ? 'rgba(255,255,255,0.85)' : 'rgba(38,38,38,0.9)';
    const fillColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(38,38,38,0.06)';

    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    
    // Move to first point
    const firstX = padding.left;
    const firstY = padding.top + chartHeight - ((data[0].users - minUsers) / userRange) * chartHeight;
    ctx.moveTo(firstX, firstY);

    // Draw smooth curve through all points using quadratic Bézier curves
    for (let i = 0; i < data.length - 1; i++) {
      const x1 = padding.left + (chartWidth / (data.length - 1)) * i;
      const y1 = padding.top + chartHeight - ((data[i].users - minUsers) / userRange) * chartHeight;
      
      const x2 = padding.left + (chartWidth / (data.length - 1)) * (i + 1);
      const y2 = padding.top + chartHeight - ((data[i + 1].users - minUsers) / userRange) * chartHeight;

      // Control point for smooth curve
      const cpX = (x1 + x2) / 2;
      const cpY = (y1 + y2) / 2;

      ctx.quadraticCurveTo(x1, y1, cpX, cpY);
    }

    // Draw to last point
    const lastX = padding.left + chartWidth;
    const lastY = padding.top + chartHeight - ((data[data.length - 1].users - minUsers) / userRange) * chartHeight;
    ctx.lineTo(lastX, lastY);
    ctx.stroke();

    // Fill area under curve (flat, no gradient)
    ctx.lineTo(lastX, padding.top + chartHeight);
    ctx.lineTo(padding.left, padding.top + chartHeight);
    ctx.closePath();

    ctx.fillStyle = fillColor;
    ctx.fill();

    // Draw data points
    data.forEach((point, index) => {
      const x = padding.left + (chartWidth / (data.length - 1)) * index;
      const y = padding.top + chartHeight - ((point.users - minUsers) / userRange) * chartHeight;

      // Draw point
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = lineColor;
      ctx.fill();
      ctx.strokeStyle = isDark ? '#0a0a0a' : '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

  }, [data, locale]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    const chartWidth = rect.width - padding.left - padding.right;

    // Find closest data point
    const index = Math.round(((x - padding.left) / chartWidth) * (data.length - 1));
    
    if (index >= 0 && index < data.length) {
      setHoveredPoint(data[index]);

      if (tooltipRef.current) {
        tooltipRef.current.style.left = `${x + 10}px`;
        tooltipRef.current.style.top = `${y - 40}px`;
      }
    } else {
      setHoveredPoint(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  if (isLoading) {
    return (
      <Card className="bg-white dark:bg-[#262626] border-2 border-[#DDDDDD] dark:border-[#000000]">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            {locale === 'ar' ? 'نمو المستخدمين (آخر 30 يوماً)' : 'User Growth (Last 30 Days)'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-80">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats || data.length === 0) {
    return (
      <Card className="bg-white dark:bg-[#262626] border-2 border-[#DDDDDD] dark:border-[#000000]">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            {locale === 'ar' ? 'نمو المستخدمين (آخر 30 يوماً)' : 'User Growth (Last 30 Days)'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-80 text-muted-foreground">
            {locale === 'ar' ? 'لا توجد بيانات متاحة' : 'No data available'}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-[#262626] border-2 border-[#DDDDDD] dark:border-[#000000]">
      <CardHeader>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              {locale === 'ar' ? 'نمو المستخدمين (آخر 30 يوماً)' : 'User Growth (Last 30 Days)'}
            </CardTitle>
            <CardDescription className="mt-2">
              {locale === 'ar'
                ? 'تتبع نمو قاعدة المستخدمين مع مرور الوقت'
                : 'Track your user base growth over time'}
            </CardDescription>
          </div>
          
          <div className="flex gap-4">
            <div className="text-center lg:text-right">
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <Users className="w-4 h-4" />
                {locale === 'ar' ? 'إجمالي المستخدمين' : 'Total Users'}
              </div>
              <div className="text-2xl font-bold text-primary">{stats.totalUsers}</div>
            </div>
            
            <div className="text-center lg:text-right">
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                {locale === 'ar' ? 'النمو' : 'Growth'}
              </div>
              <div className={`text-2xl font-bold ${stats.growthRate >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {stats.growthRate >= 0 ? '+' : ''}{stats.growthRate}%
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="relative">
          <canvas
            ref={canvasRef}
            className="block w-full h-80 cursor-crosshair"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          />
          
          {hoveredPoint && (
            <div
              ref={tooltipRef}
              className={`absolute pointer-events-none bg-background border border-border rounded-lg px-3 py-2 text-sm ${isRTL ? '-translate-x-full' : ''}`}
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-3 h-3 text-muted-foreground" />
                <span className="font-medium">{hoveredPoint.label}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Users className="w-3 h-3 text-primary" />
                <span className="font-bold text-primary">{hoveredPoint.users} {locale === 'ar' ? 'مستخدم' : 'users'}</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
