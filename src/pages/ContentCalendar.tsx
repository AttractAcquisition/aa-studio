import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Grid,
  List,
  Filter
} from "lucide-react";
import { cn } from "@/lib/utils";

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const scheduledPosts = [
  { id: 1, day: 3, title: "Hook Formula", series: "Fix My Funnel", type: "Reel", status: "scheduled" },
  { id: 2, day: 5, title: "Audit Results", series: "Attraction Audit", type: "Carousel", status: "draft" },
  { id: 3, day: 8, title: "Brand Model", series: "Unavoidable Brand", type: "One-Pager", status: "scheduled" },
  { id: 4, day: 12, title: "Ad Creative Tips", series: "Ad Creative", type: "Reel", status: "scheduled" },
  { id: 5, day: 15, title: "Case Study", series: "Noise → Bookings", type: "Proof Card", status: "published" },
  { id: 6, day: 18, title: "Framework Deep Dive", series: "Fix My Funnel", type: "Carousel", status: "draft" },
];

const statusStyles = {
  draft: "bg-muted border-muted-foreground/20",
  scheduled: "bg-primary/10 border-primary/30",
  published: "bg-green-500/10 border-green-500/30",
};

const statusTextStyles = {
  draft: "text-muted-foreground",
  scheduled: "text-primary",
  published: "text-green-400",
};

export default function ContentCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"month" | "week">("month");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthName = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  return (
    <AppLayout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <div className="aa-pill-primary mb-4">Content Calendar</div>
            <h1 className="aa-headline-lg text-foreground">
              Publishing <span className="aa-gradient-text">Schedule</span>
            </h1>
            <p className="aa-body mt-2">
              Plan, schedule, and track your content publishing.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="flex rounded-xl bg-secondary p-1">
              <Button 
                variant={view === "week" ? "secondary" : "ghost"} 
                size="sm"
                onClick={() => setView("week")}
              >
                <List className="w-4 h-4 mr-1" />
                Week
              </Button>
              <Button 
                variant={view === "month" ? "secondary" : "ghost"} 
                size="sm"
                onClick={() => setView("month")}
              >
                <Grid className="w-4 h-4 mr-1" />
                Month
              </Button>
            </div>
            <Button variant="gradient">
              <Plus className="w-4 h-4 mr-2" />
              Schedule Post
            </Button>
          </div>
        </div>

        {/* Calendar Navigation */}
        <div className="aa-card mb-6">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={prevMonth}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h2 className="text-xl font-bold text-foreground">{monthName}</h2>
            <Button variant="ghost" size="icon" onClick={nextMonth}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="aa-card">
          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {daysOfWeek.map((day) => (
              <div key={day} className="text-center py-2">
                <span className="text-sm font-medium text-muted-foreground">{day}</span>
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-2">
            {days.map((day, index) => {
              const postsForDay = day ? scheduledPosts.filter(p => p.day === day) : [];
              const isToday = day === new Date().getDate() && 
                month === new Date().getMonth() && 
                year === new Date().getFullYear();

              return (
                <div
                  key={index}
                  className={cn(
                    "min-h-[120px] rounded-xl p-2 border transition-colors",
                    day ? "bg-secondary/30 border-border hover:border-primary/30 cursor-pointer" : "bg-transparent border-transparent",
                    isToday && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                  )}
                >
                  {day && (
                    <>
                      <span className={cn(
                        "text-sm font-medium",
                        isToday ? "text-primary" : "text-foreground"
                      )}>
                        {day}
                      </span>
                      <div className="mt-2 space-y-1">
                        {postsForDay.map((post) => (
                          <div
                            key={post.id}
                            className={cn(
                              "p-1.5 rounded-lg border text-xs cursor-pointer hover:scale-105 transition-transform",
                              statusStyles[post.status as keyof typeof statusStyles]
                            )}
                          >
                            <p className={cn(
                              "font-medium truncate",
                              statusTextStyles[post.status as keyof typeof statusTextStyles]
                            )}>
                              {post.title}
                            </p>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {post.type}
                            </p>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-muted border border-muted-foreground/20" />
            <span className="text-sm text-muted-foreground">Draft</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary/20 border border-primary/30" />
            <span className="text-sm text-muted-foreground">Scheduled</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/30" />
            <span className="text-sm text-muted-foreground">Published</span>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
