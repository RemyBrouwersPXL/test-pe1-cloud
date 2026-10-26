import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface CountdownTimerProps {
  endTime: string;
  status: string;
  onExpire?: () => void;
  compact?: boolean;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  endTime,
  status,
  onExpire,
  compact = false,
}) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    totalSeconds: number;
    isExpired: boolean;
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    totalSeconds: 0,
    isExpired: false,
  });

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date().getTime();
      const end = new Date(endTime).getTime();
      const diff = end - now;

      if (diff <= 0 || status !== 'ACTIVE') {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          totalSeconds: 0,
          isExpired: true,
        });
        if (diff <= 0 && status === 'ACTIVE' && onExpire) {
          onExpire();
        }
        return;
      }

      const totalSeconds = Math.floor(diff / 1000);
      const days = Math.floor(totalSeconds / (3600 * 24));
      const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      setTimeLeft({
        days,
        hours,
        minutes,
        seconds,
        totalSeconds,
        isExpired: false,
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [endTime, status, onExpire]);

  if (status !== 'ACTIVE' || timeLeft.isExpired) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-800 text-slate-300">
        <Clock className="w-3.5 h-3.5 text-slate-400" />
        {status === 'SOLD' ? 'SOLD' : status === 'RESERVE_NOT_MET' ? 'RESERVE NOT MET' : 'ENDED'}
      </span>
    );
  }

  const isUrgent = timeLeft.totalSeconds <= 120; // Last 2 minutes anti-sniping window!
  const isEndingSoon = timeLeft.totalSeconds <= 3600; // Last 1 hour

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold tracking-tight ${
          isUrgent
            ? 'bg-red-500/20 text-red-400 animate-pulse border border-red-500/40'
            : isEndingSoon
            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            : 'bg-slate-800 text-slate-200'
        }`}
      >
        <Clock className="w-3 h-3" />
        {timeLeft.days > 0 ? (
          `${timeLeft.days}d ${timeLeft.hours}h`
        ) : timeLeft.hours > 0 ? (
          `${timeLeft.hours}h ${timeLeft.minutes}m`
        ) : (
          `${String(timeLeft.minutes).padStart(2, '0')}:${String(timeLeft.seconds).padStart(2, '0')}`
        )}
      </span>
    );
  }

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-sm font-semibold ${
        isUrgent
          ? 'bg-red-950/60 border border-red-500 text-red-300 animate-pulse'
          : isEndingSoon
          ? 'bg-amber-950/40 border border-amber-500/60 text-amber-300'
          : 'bg-slate-800/80 border border-slate-700 text-slate-200'
      }`}
    >
      {isUrgent ? (
        <AlertTriangle className="w-4 h-4 text-red-400 animate-bounce" />
      ) : (
        <Clock className="w-4 h-4 text-amber-400" />
      )}
      <div className="flex items-center gap-1 text-base tracking-wider">
        {timeLeft.days > 0 && <span>{timeLeft.days}d</span>}
        <span>{String(timeLeft.hours).padStart(2, '0')}h</span>
        <span>:</span>
        <span>{String(timeLeft.minutes).padStart(2, '0')}m</span>
        <span>:</span>
        <span>{String(timeLeft.seconds).padStart(2, '0')}s</span>
      </div>
      {isUrgent && (
        <span className="text-xs bg-red-600 text-white px-1.5 py-0.5 rounded uppercase font-sans font-bold">
          Anti-Sniping Active
        </span>
      )}
    </div>
  );
};
