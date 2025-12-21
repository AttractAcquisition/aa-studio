import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Search, 
  Trophy,
  MessageSquare,
  TrendingUp,
  Eye,
  EyeOff,
  Image,
  LayoutTemplate
} from "lucide-react";
import { cn } from "@/lib/utils";

const mockProofs = [
  { 
    id: 1, 
    industry: "Dental Clinic", 
    summary: "3x DM increase in 2 weeks after hook rewrite", 
    score: 94, 
    date: "Dec 18, 2024",
    hasBlurred: true
  },
  { 
    id: 2, 
    industry: "Fitness Studio", 
    summary: "New leads went from 5/week to 23/week", 
    score: 91, 
    date: "Dec 15, 2024",
    hasBlurred: true
  },
  { 
    id: 3, 
    industry: "Real Estate", 
    summary: "Bio CTA change drove 40% more profile visits", 
    score: 87, 
    date: "Dec 12, 2024",
    hasBlurred: false
  },
  { 
    id: 4, 
    industry: "Restaurant", 
    summary: "Carousel framework increased saves by 8x", 
    score: 89, 
    date: "Dec 8, 2024",
    hasBlurred: true
  },
  { 
    id: 5, 
    industry: "Med Spa", 
    summary: "DM automation converted 34% more inquiries", 
    score: 96, 
    date: "Dec 5, 2024",
    hasBlurred: false
  },
];

export default function ProofVault() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProofs = mockProofs.filter((proof) =>
    proof.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
    proof.industry.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <div className="aa-pill-primary mb-4">Proof Vault</div>
            <h1 className="aa-headline-lg text-foreground">
              Results & <span className="aa-gradient-text">Proof</span>
            </h1>
            <p className="aa-body mt-2">
              Store DM screenshots, metrics, and client wins. Generate proof cards instantly.
            </p>
          </div>
          <Button variant="gradient">
            <Plus className="w-4 h-4 mr-2" />
            Add Proof
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mb-10">
          <div className="aa-card text-center">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 mx-auto mb-3 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-primary" />
            </div>
            <p className="text-3xl font-black text-foreground">{mockProofs.length}</p>
            <p className="text-sm text-muted-foreground">Total Proofs</p>
          </div>
          <div className="aa-card text-center">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 mx-auto mb-3 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <p className="text-3xl font-black text-foreground">91%</p>
            <p className="text-sm text-muted-foreground">Avg. Score</p>
          </div>
          <div className="aa-card text-center">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 mx-auto mb-3 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-primary" />
            </div>
            <p className="text-3xl font-black text-foreground">47</p>
            <p className="text-sm text-muted-foreground">DM Screenshots</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search proofs by industry or result..."
            className="pl-12 h-14 text-base"
          />
        </div>

        {/* Proof Cards */}
        <div className="space-y-4">
          {filteredProofs.map((proof, index) => (
            <div 
              key={proof.id} 
              className="aa-card hover:border-primary/30 transition-all animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start gap-6">
                {/* Image Placeholder */}
                <div className="w-32 h-32 rounded-2xl bg-muted flex-shrink-0 flex items-center justify-center relative">
                  <Image className="w-8 h-8 text-muted-foreground" />
                  {proof.hasBlurred && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                      <EyeOff className="w-3 h-3 text-primary" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="aa-pill-outline text-[10px] mb-2 inline-block">{proof.industry}</span>
                      <h3 className="font-bold text-lg text-foreground">{proof.summary}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{proof.date}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Attraction Score */}
                      <div className="px-4 py-2 rounded-full bg-gradient-to-r from-primary to-accent">
                        <span className="text-sm font-bold text-primary-foreground">{proof.score}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 mt-4">
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button variant="outline" size="sm">
                      {proof.hasBlurred ? (
                        <>
                          <EyeOff className="w-4 h-4 mr-1" />
                          Blurred
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-4 h-4 mr-1" />
                          Add Blur
                        </>
                      )}
                    </Button>
                    <Button variant="gradient" size="sm">
                      <LayoutTemplate className="w-4 h-4 mr-1" />
                      Generate Proof Card
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredProofs.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-muted mx-auto mb-4 flex items-center justify-center">
              <Trophy className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="font-semibold text-foreground">No proofs found</p>
            <p className="text-sm text-muted-foreground mt-1">Try adjusting your search</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
