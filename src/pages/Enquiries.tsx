import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  MessageSquare,
  Calendar,
  TrendingUp,
  Loader2,
  Trash2,
  ClipboardCheck,
  Phone,
  DollarSign,
  ChevronDown,
} from "lucide-react";
import { useEvents, EventType, EventRow } from "@/hooks/useEvents";
import { LogEventModal } from "@/components/modals/LogEventModal";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const eventTypeLabels: Record<EventType, string> = {
  enquiry: "Enquiry",
  audit_request: "Audit Request",
  booked_call: "Booked Call",
  conversion: "Conversion",
};

const eventTypeIcons: Record<EventType, typeof MessageSquare> = {
  enquiry: MessageSquare,
  audit_request: ClipboardCheck,
  booked_call: Phone,
  conversion: DollarSign,
};

const eventTypeColors: Record<EventType, string> = {
  enquiry: "bg-primary/10 text-primary",
  audit_request: "bg-blue-500/10 text-blue-500",
  booked_call: "bg-amber-500/10 text-amber-500",
  conversion: "bg-green-500/10 text-green-500",
};

type DateFilter = "7days" | "30days" | "all";

export default function Enquiries() {
  const [searchQuery, setSearchQuery] = useState("");
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [modalDefaultType, setModalDefaultType] = useState<EventType>("enquiry");
  const [typeFilter, setTypeFilter] = useState<EventType | "all">("all");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");

  const { 
    events,
    enquiries, 
    bookedCalls, 
    conversions, 
    auditRequests,
    isLoading, 
    deleteEvent, 
    conversionRates,
    last7Days,
    totalConversionValue,
  } = useEvents();

  // Get unique platforms from events
  const platforms = [...new Set(events.map(e => e.platform).filter(Boolean))] as string[];

  // Apply filters
  const filteredEvents = events.filter((e) => {
    // Type filter
    if (typeFilter !== "all" && e.type !== typeFilter) return false;
    
    // Platform filter
    if (platformFilter !== "all" && e.platform !== platformFilter) return false;
    
    // Date filter
    if (dateFilter !== "all") {
      const eventDate = new Date(e.occurred_at);
      const now = new Date();
      const daysAgo = dateFilter === "7days" ? 7 : 30;
      const cutoff = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      if (eventDate < cutoff) return false;
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        e.keyword?.toLowerCase().includes(query) ||
        e.platform?.toLowerCase().includes(query) ||
        e.notes?.toLowerCase().includes(query) ||
        e.contact_name?.toLowerCase().includes(query) ||
        e.contact_handle?.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  const openLogModal = (type: EventType) => {
    setModalDefaultType(type);
    setLogModalOpen(true);
  };

  const getEventTitle = (event: EventRow): string => {
    if (event.contact_name) return event.contact_name;
    if (event.keyword) return event.keyword;
    if (event.contact_handle) return event.contact_handle;
    return eventTypeLabels[event.type as EventType];
  };

  const handleDelete = (id: string) => {
    deleteEvent(id);
    toast.success("Event deleted");
  };

  return (
    <AppLayout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <div className="aa-pill-primary mb-4">Events</div>
            <h1 className="aa-headline-lg text-foreground">
              Lead <span className="aa-gradient-text">Tracking</span>
            </h1>
            <p className="aa-body mt-2">
              Log and track enquiries, audit requests, booked calls, and conversions.
            </p>
          </div>
          
          {/* Log Event Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="gradient">
                <Plus className="w-4 h-4 mr-2" />
                Log Event
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-card border-border">
              <DropdownMenuItem onClick={() => openLogModal("enquiry")}>
                <MessageSquare className="w-4 h-4 mr-2 text-primary" />
                Log Enquiry
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openLogModal("audit_request")}>
                <ClipboardCheck className="w-4 h-4 mr-2 text-blue-500" />
                Log Audit Request
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openLogModal("booked_call")}>
                <Phone className="w-4 h-4 mr-2 text-amber-500" />
                Log Booked Call
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openLogModal("conversion")}>
                <DollarSign className="w-4 h-4 mr-2 text-green-500" />
                Log Conversion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
          <div className="aa-card text-center">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 mx-auto mb-3 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-primary" />
            </div>
            <p className="text-3xl font-black text-foreground">{enquiries.length}</p>
            <p className="text-sm text-muted-foreground">Total Enquiries</p>
            <p className="text-xs text-primary mt-1">{last7Days.enquiries} last 7 days</p>
          </div>
          <div className="aa-card text-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 mx-auto mb-3 flex items-center justify-center">
              <ClipboardCheck className="w-6 h-6 text-blue-500" />
            </div>
            <p className="text-3xl font-black text-foreground">{auditRequests.length}</p>
            <p className="text-sm text-muted-foreground">Audit Requests</p>
            <p className="text-xs text-blue-500 mt-1">
              {conversionRates.auditRequestRate}% of enquiries · {last7Days.auditRequests} last 7d
            </p>
          </div>
          <div className="aa-card text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 mx-auto mb-3 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-amber-500" />
            </div>
            <p className="text-3xl font-black text-foreground">{bookedCalls.length}</p>
            <p className="text-sm text-muted-foreground">Booked Calls</p>
            <p className="text-xs text-amber-500 mt-1">
              {conversionRates.bookedCallRate}% of audits · {last7Days.bookedCalls} last 7d
            </p>
          </div>
          <div className="aa-card text-center">
            <div className="w-12 h-12 rounded-2xl bg-green-500/10 mx-auto mb-3 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-500" />
            </div>
            <p className="text-3xl font-black text-foreground">{conversions.length}</p>
            <p className="text-sm text-muted-foreground">Conversions</p>
            <p className="text-xs text-green-500 mt-1">
              {conversionRates.conversionRate}% of calls · {last7Days.conversions} last 7d
            </p>
          </div>
        </div>

        {/* Total Conversion Value */}
        {totalConversionValue > 0 && (
          <div className="aa-card mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Conversion Value</p>
                <p className="text-2xl font-bold text-foreground">
                  R{totalConversionValue.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search keyword, name, handle, notes..."
              className="pl-12 h-12"
            />
          </div>
          
          {/* Type Filter */}
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as EventType | "all")}>
            <SelectTrigger className="w-[160px] h-12">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="enquiry">Enquiries</SelectItem>
              <SelectItem value="audit_request">Audit Requests</SelectItem>
              <SelectItem value="booked_call">Booked Calls</SelectItem>
              <SelectItem value="conversion">Conversions</SelectItem>
            </SelectContent>
          </Select>

          {/* Platform Filter */}
          <Select value={platformFilter} onValueChange={setPlatformFilter}>
            <SelectTrigger className="w-[160px] h-12">
              <SelectValue placeholder="All Platforms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              {platforms.map((p) => (
                <SelectItem key={p} value={p}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date Filter */}
          <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilter)}>
            <SelectTrigger className="w-[140px] h-12">
              <SelectValue placeholder="All Time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Events List */}
        {isLoading ? (
          <div className="text-center py-16">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground mt-4">Loading events...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-muted mx-auto mb-4 flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="font-semibold text-foreground">No events found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {searchQuery || typeFilter !== "all" || platformFilter !== "all" || dateFilter !== "all"
                ? "Try adjusting your filters"
                : "Log your first event to get started"}
            </p>
          </div>
        ) : (
          <div className="aa-card">
            <div className="space-y-3">
              {filteredEvents.map((event, index) => {
                const eventType = event.type as EventType;
                const Icon = eventTypeIcons[eventType] || MessageSquare;
                const colorClass = eventTypeColors[eventType] || "bg-primary/10 text-primary";
                
                return (
                  <div
                    key={event.id}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-secondary/50 hover:bg-secondary transition-colors group animate-fade-in"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass.split(" ")[0]}`}>
                      <Icon className={`w-5 h-5 ${colorClass.split(" ")[1]}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-foreground">{getEventTitle(event)}</span>
                        <span className={`aa-pill-outline text-[10px] ${
                          eventType === "conversion" ? "border-green-500/50 text-green-500" :
                          eventType === "booked_call" ? "border-amber-500/50 text-amber-500" :
                          eventType === "audit_request" ? "border-blue-500/50 text-blue-500" :
                          ""
                        }`}>
                          {eventTypeLabels[eventType]}
                        </span>
                        {event.platform && (
                          <span className="aa-pill-outline text-[10px]">{event.platform}</span>
                        )}
                        {eventType === "conversion" && event.value && (
                          <span className="text-xs font-semibold text-green-500">
                            R{event.value.toLocaleString()}
                          </span>
                        )}
                      </div>
                      {(event.notes || event.contact_handle) && (
                        <p className="text-sm text-muted-foreground truncate mt-1">
                          {event.contact_handle && <span className="text-primary">{event.contact_handle} </span>}
                          {event.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        {format(new Date(event.occurred_at), "MMM d, h:mm a")}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(event.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <LogEventModal 
        open={logModalOpen} 
        onOpenChange={setLogModalOpen}
        defaultType={modalDefaultType}
      />
    </AppLayout>
  );
}
