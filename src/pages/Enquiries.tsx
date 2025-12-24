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
} from "lucide-react";
import { useEvents } from "@/hooks/useEvents";
import { LogEnquiryModal } from "@/components/modals/LogEnquiryModal";
import { format } from "date-fns";

export default function Enquiries() {
  const [searchQuery, setSearchQuery] = useState("");
  const [logModalOpen, setLogModalOpen] = useState(false);

  const { enquiries, bookedCalls, conversions, isLoading, deleteEvent } = useEvents();

  const filteredEnquiries = enquiries.filter(
    (e: any) =>
      e.keyword?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.platform?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.notes?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const enquiriesToday = enquiries.filter(
    (e: any) => new Date(e.occurred_at) >= today
  ).length;

  const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const enquiriesThisWeek = enquiries.filter(
    (e: any) => new Date(e.occurred_at) >= thisWeek
  ).length;

  return (
    <AppLayout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <div className="aa-pill-primary mb-4">Enquiries</div>
            <h1 className="aa-headline-lg text-foreground">
              Lead <span className="aa-gradient-text">Tracking</span>
            </h1>
            <p className="aa-body mt-2">
              Log and track enquiries, booked calls, and conversions.
            </p>
          </div>
          <Button variant="gradient" onClick={() => setLogModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Log Enquiry
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-6 mb-10">
          <div className="aa-card text-center">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 mx-auto mb-3 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-primary" />
            </div>
            <p className="text-3xl font-black text-foreground">{enquiries.length}</p>
            <p className="text-sm text-muted-foreground">Total Enquiries</p>
          </div>
          <div className="aa-card text-center">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 mx-auto mb-3 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <p className="text-3xl font-black text-foreground">{enquiriesToday}</p>
            <p className="text-sm text-muted-foreground">Today</p>
          </div>
          <div className="aa-card text-center">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 mx-auto mb-3 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <p className="text-3xl font-black text-foreground">{bookedCalls.length}</p>
            <p className="text-sm text-muted-foreground">Booked Calls</p>
          </div>
          <div className="aa-card text-center">
            <div className="w-12 h-12 rounded-2xl bg-green-500/10 mx-auto mb-3 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-500" />
            </div>
            <p className="text-3xl font-black text-foreground">{conversions.length}</p>
            <p className="text-sm text-muted-foreground">Conversions</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by keyword, platform, or notes..."
            className="pl-12 h-14 text-base"
          />
        </div>

        {/* Enquiries List */}
        {isLoading ? (
          <div className="text-center py-16">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground mt-4">Loading enquiries...</p>
          </div>
        ) : filteredEnquiries.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-muted mx-auto mb-4 flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="font-semibold text-foreground">No enquiries found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {searchQuery ? "Try adjusting your search" : "Log your first enquiry to get started"}
            </p>
          </div>
        ) : (
          <div className="aa-card">
            <div className="space-y-3">
              {filteredEnquiries.map((enquiry: any, index: number) => (
                <div
                  key={enquiry.id}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-secondary/50 hover:bg-secondary transition-colors group animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">{enquiry.keyword}</span>
                      <span className="aa-pill-outline text-[10px]">{enquiry.platform}</span>
                    </div>
                    {enquiry.notes && (
                      <p className="text-sm text-muted-foreground truncate mt-1">
                        {enquiry.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(enquiry.occurred_at), "MMM d, h:mm a")}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
                      onClick={() => deleteEvent(enquiry.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <LogEnquiryModal open={logModalOpen} onOpenChange={setLogModalOpen} />
    </AppLayout>
  );
}
