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
  LayoutTemplate,
  Loader2,
  CalendarPlus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useProofs } from "@/hooks/useProofs";
import { useProofCards } from "@/hooks/useProofCards";
import { useScheduledPosts } from "@/hooks/useScheduledPosts";
import { AddProofModal } from "@/components/modals/AddProofModal";
import { ProofScreenshotModal } from "@/components/modals/ProofScreenshotModal";
import { toast } from "sonner";

export default function ProofVault() {
  const [searchQuery, setSearchQuery] = useState("");
  const [addProofOpen, setAddProofOpen] = useState(false);
  const [viewProof, setViewProof] = useState<any>(null);
  const [generatingProofCardId, setGeneratingProofCardId] = useState<string | null>(null);

  const { proofs, stats, isLoading, updateProof } = useProofs();
  const { proofCards, createProofCard, isCreating: isCreatingProofCard } = useProofCards();
  const { createScheduledPost } = useScheduledPosts();

  const filteredProofs = proofs.filter((proof: any) =>
    proof.headline?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    proof.industry?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleBlur = (proof: any) => {
    updateProof({ id: proof.id, is_blurred: !proof.is_blurred });
    toast.success(proof.is_blurred ? "Blur removed" : "Blur added");
  };

  const handleGenerateProofCard = async (proof: any) => {
    setGeneratingProofCardId(proof.id);
    try {
      await createProofCard({
        proof_id: proof.id,
        client_name: proof.industry || "Client",
        claim: proof.headline,
        metric: proof.metric,
        timeframe: proof.happened_at ? new Date(proof.happened_at).toLocaleDateString() : undefined,
        proof_type: "result",
      });
      toast.success("Proof card created!");
    } catch (error) {
      toast.error("Failed to generate proof card");
    } finally {
      setGeneratingProofCardId(null);
    }
  };

  const handleUseAsPost = async (proofCard: any) => {
    try {
      await createScheduledPost({
        title: proofCard.claim,
        post_type: "proof",
        scheduled_for: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        proof_card_id: proofCard.id,
        platform: "instagram",
      });
      toast.success("Added to calendar as draft!");
    } catch (error) {
      toast.error("Failed to add to calendar");
    }
  };

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
          <Button variant="gradient" onClick={() => setAddProofOpen(true)}>
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
            <p className="text-3xl font-black text-foreground">{stats.totalProofs}</p>
            <p className="text-sm text-muted-foreground">Total Proofs</p>
          </div>
          <div className="aa-card text-center">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 mx-auto mb-3 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <p className="text-3xl font-black text-foreground">{stats.avgScore}%</p>
            <p className="text-sm text-muted-foreground">Avg. Score</p>
          </div>
          <div className="aa-card text-center">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 mx-auto mb-3 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-primary" />
            </div>
            <p className="text-3xl font-black text-foreground">{stats.dmScreenshots}</p>
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

        {/* Loading State */}
        {isLoading ? (
          <div className="text-center py-16">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground mt-4">Loading proofs...</p>
          </div>
        ) : (
          <>
            {/* Proof Cards */}
            <div className="space-y-4">
              {filteredProofs.map((proof: any, index: number) => (
                <div 
                  key={proof.id} 
                  className="aa-card hover:border-primary/30 transition-all animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start gap-6">
                    {/* Image */}
                    <div className={cn(
                      "w-32 h-32 rounded-2xl bg-muted flex-shrink-0 flex items-center justify-center relative overflow-hidden",
                      proof.is_blurred && "blur-sm"
                    )}>
                      {proof.screenshotUrl ? (
                        <img 
                          src={proof.screenshotUrl} 
                          alt={proof.headline}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Image className="w-8 h-8 text-muted-foreground" />
                      )}
                      {proof.is_blurred && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                          <EyeOff className="w-3 h-3 text-primary" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          {proof.industry && (
                            <span className="aa-pill-outline text-[10px] mb-2 inline-block">{proof.industry}</span>
                          )}
                          <h3 className="font-bold text-lg text-foreground">{proof.headline}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {proof.happened_at 
                              ? new Date(proof.happened_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                              : new Date(proof.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                            }
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          {proof.score && (
                            <div className="px-4 py-2 rounded-full bg-gradient-to-r from-primary to-accent">
                              <span className="text-sm font-bold text-primary-foreground">{proof.score}%</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-3 mt-4">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setViewProof({
                            headline: proof.headline,
                            industry: proof.industry,
                            publicUrl: proof.screenshotUrl,
                          })}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleToggleBlur(proof)}
                        >
                          <EyeOff className="w-4 h-4 mr-1" />
                          {proof.is_blurred ? "Remove Blur" : "Add Blur"}
                        </Button>
                        <Button 
                          variant="gradient" 
                          size="sm"
                          onClick={() => handleGenerateProofCard(proof)}
                          disabled={generatingProofCardId === proof.id}
                        >
                          {generatingProofCardId === proof.id ? (
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          ) : (
                            <LayoutTemplate className="w-4 h-4 mr-1" />
                          )}
                          Generate Proof Card
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Generated Proof Cards Section */}
            {proofCards.length > 0 && (
              <div className="mt-12">
                <h2 className="text-xl font-bold text-foreground mb-6">Generated Proof Cards</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {proofCards.map((card: any) => (
                    <div key={card.id} className="aa-card">
                      {card.assetUrl ? (
                        <img 
                          src={card.assetUrl} 
                          alt={card.claim}
                          className="w-full aspect-[4/5] object-cover rounded-xl mb-4"
                        />
                      ) : (
                        <div className="w-full aspect-[4/5] bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl mb-4 flex items-center justify-center">
                          <LayoutTemplate className="w-12 h-12 text-primary/50" />
                        </div>
                      )}
                      <h3 className="font-bold text-foreground">{card.claim}</h3>
                      {card.client_name && (
                        <p className="text-sm text-muted-foreground mt-1">{card.client_name}</p>
                      )}
                      {card.metric && (
                        <span className="aa-pill bg-primary/10 text-primary text-xs mt-2 inline-block">
                          {card.metric}
                        </span>
                      )}
                      <div className="flex gap-2 mt-4">
                        <Button
                          variant="gradient"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleUseAsPost(card)}
                        >
                          <CalendarPlus className="w-4 h-4 mr-1" />
                          Use as Post
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {filteredProofs.length === 0 && !isLoading && (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-2xl bg-muted mx-auto mb-4 flex items-center justify-center">
                  <Trophy className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="font-semibold text-foreground">No proofs found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchQuery ? "Try adjusting your search" : "Add your first proof to get started"}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <AddProofModal open={addProofOpen} onOpenChange={setAddProofOpen} />
      <ProofScreenshotModal 
        open={!!viewProof} 
        onOpenChange={(open) => !open && setViewProof(null)} 
        proof={viewProof} 
      />
    </AppLayout>
  );
}
