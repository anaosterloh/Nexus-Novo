import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertCircle, 
  Truck, 
  Package, 
  FileText, 
  User, 
  CreditCard,
  Wrench,
  Search,
  RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  time: string;
  status: 'completed' | 'current' | 'pending' | 'error';
  icon?: any;
  metadata?: {
    label: string;
    value: string;
  }[];
}

interface TrackingTimelineProps {
  events: TimelineEvent[];
}

export function TrackingTimeline({ events }: TrackingTimelineProps) {
  return (
    <div className="relative space-y-0">
      {events.map((event, index) => {
        const isLast = index === events.length - 1;
        const Icon = event.icon || Circle;

        return (
          <div key={event.id} className="flex gap-4 group">
            {/* Left Column: Date/Time */}
            <div className="w-24 flex flex-col items-end pt-1 text-right">
              <span className={cn(
                "text-xs font-bold",
                event.status === 'completed' ? "text-zinc-900 dark:text-zinc-100" : 
                event.status === 'current' ? "text-blue-600 dark:text-blue-400" : "text-zinc-400"
              )}>
                {event.date}
              </span>
              <span className="text-[10px] text-zinc-500">{event.time}</span>
            </div>

            {/* Middle Column: Line and Dot */}
            <div className="relative flex flex-col items-center">
              <div className={cn(
                "w-8 h-8 rounded-full border-2 flex items-center justify-center z-10 bg-white dark:bg-zinc-950 transition-colors",
                event.status === 'completed' ? "border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20" :
                event.status === 'current' ? "border-blue-500 text-blue-600 bg-blue-50 animate-pulse dark:bg-blue-900/20" :
                event.status === 'error' ? "border-rose-500 text-rose-600 bg-rose-50 dark:bg-rose-900/20" :
                "border-zinc-200 text-zinc-300 dark:border-zinc-800"
              )}>
                <Icon className="w-4 h-4" />
              </div>
              {!isLast && (
                <div className={cn(
                  "w-0.5 grow absolute top-8 bottom-0",
                  event.status === 'completed' ? "bg-emerald-200 dark:bg-emerald-900/50" : "bg-zinc-100 dark:bg-zinc-800"
                )} />
              )}
            </div>

            {/* Right Column: Content */}
            <div className="flex-1 pb-8 pt-1">
              <h4 className={cn(
                "text-sm font-bold mb-1",
                event.status === 'completed' ? "text-zinc-900 dark:text-zinc-100" :
                event.status === 'current' ? "text-blue-600 dark:text-blue-400" :
                event.status === 'error' ? "text-rose-600" :
                "text-zinc-400"
              )}>
                {event.title}
              </h4>
              
              {event.description && (
                <p className="text-xs text-zinc-500 mb-2 max-w-md">
                  {event.description}
                </p>
              )}

              {event.metadata && event.metadata.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {event.metadata.map((meta, idx) => (
                    <div key={idx} className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded px-2 py-1 text-[10px]">
                      <span className="text-zinc-400 mr-1">{meta.label}:</span>
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">{meta.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
