import { useState, useRef } from "react";
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
  CalendarPlus,
  Download,
  RefreshCw,
  Trash2,
  Pencil,
  Upload
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useProofs } from "@/hooks/useProofs";
import { useProofCards } from "@/hooks/useProofCards";
import { useScheduledPosts } from "@/hooks/useScheduledPosts";
import { AddProofModal } from "@/components/modals/AddProofModal";
import { ProofScreenshotModal } from "@/components/modals/ProofScreenshotModal";
import { EditProofModal } from "@/components/modals/EditProofModal";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ProofVault() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [addProofOpen, setAddProofOpen] = useState(false);
  const [viewProof, setViewProof] = useState<any>(null);
  const [editProof, setEditProof] = useState<any>(null);
  const [deleteProofId, setDeleteProofId] = useState<string | null>(null);
  const [generatingProofCardId, setGeneratingProofCardId] = useState<string | null>(null);
  const [regeneratingCardId, setRegeneratingCardId] = useState<string | null>(null);
  const [deleteCardId, setDeleteCardId] = useState<string | null>(null);
  const [replacingCardId, setReplacingCardId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { proofs, stats, isLoading, updateProof, deleteProof } = useProofs();
  const { 
    proofCards, 
    createProofCard, 
    regenerateProofCardImage,
    updateProofCard,
    deleteProofCard,
    isCreating: isCreatingProofCard 
  } = useProofCards();
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
        industry: proof.industry,
      });
      toast.success("Proof card created!");
    } catch (error) {
      console.error("Failed to generate proof card:", error);
      toast.error("Failed to generate proof card");
    } finally {
      setGeneratingProofCardId(null);
    }
  };

  const handleRegenerateCard = async (cardId: string) => {
    setRegeneratingCardId(cardId);
    try {
      await regenerateProofCardImage(cardId);
      toast.success("Proof card image regenerated!");
    } catch (error) {
      console.error("Failed to regenerate:", error);
      toast.error("Failed to regenerate image");
    } finally {
      setRegeneratingCardId(null);
    }
  };

  const handleDeleteCard = async () => {
    if (!deleteCardId) return;
    try {
      deleteProofCard(deleteCardId);
      toast.success("Proof card deleted");
    } catch (error) {
      toast.error("Failed to delete proof card");
    } finally {
      setDeleteCardId(null);
    }
  };

  const handleDeleteProof = async () => {
    if (!deleteProofId) return;
    try {
      deleteProof(deleteProofId);
      toast.success("Proof deleted");
    } catch (error) {
      toast.error("Failed to delete proof");
    } finally {
      setDeleteProofId(null);
    }
  };

  const handleEditProofSave = async (data: any) => {
    updateProof(data);
    toast.success("Proof updated");
  };

  const handleReplacePreviewImage = async (cardId: string, file: File) => {
    if (!user) return;
    setReplacingCardId(cardId);
    try {
      const path = `${user.id}/proof-cards/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("aa-designs")
        .upload(path, file);
      if (uploadError) throw uploadError;

      // Create asset row
      const { data: asset, error: assetError } = await supabase
        .from("assets")
        .insert({
          user_id: user.id,
          bucket: "aa-designs",
          path,
          kind: "image",
          title: "Proof Card Preview",
          tags: ["proof-card"],
        })
        .select()
        .single();
      if (assetError) throw assetError;

      // Update proof card with new asset
      updateProofCard({ id: cardId, asset_id: asset.id });
      toast.success("Preview image replaced!");
    } catch (error: any) {
      toast.error(error.message || "Failed to replace image");
    } finally {
      setReplacingCardId(null);
    }
  };

  const handleExportPng = async (card: any) => {
    if (!card.assetUrl) {
      toast.error("No image to export");
      return;
    }
    try {
      const response = await fetch(card.assetUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `proof-card-${card.id}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Image downloaded!");
    } catch (error) {
      toast.error("Failed to download image");
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
            <div className="aa-pill-primary mb-4">Proof Register</div>
            <h1 className="aa-headline-lg text-foreground">
              Results & <span className="aa-gradient-text">Proof</span>
            </h1>
            <p className="aa-body mt-2">
              Store screenshots, metrics, and client wins. Generate proof cards instantly.
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
                      <div className="flex items-center gap-3 mt-4 flex-wrap">
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
                          onClick={() => setEditProof(proof)}
                        >
                          <Pencil className="w-4 h-4 mr-1" />
                          Edit
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
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteProofId(proof.id)}
                        >
                          <Trash2 className="w-4 h-4" />
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
                    <div key={card.id} className="aa-card group">
                      <div className="relative">
                        {card.assetUrl ? (
                          <img 
                            src={card.assetUrl} 
                            alt={card.claim}
                            className="w-full aspect-square object-cover rounded-xl mb-4"
                          />
                        ) : (
                          <div className="w-full aspect-square bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl mb-4 flex items-center justify-center">
                            {isCreatingProofCard ? (
                              <Loader2 className="w-12 h-12 text-primary animate-spin" />
                            ) : (
                              <LayoutTemplate className="w-12 h-12 text-primary/50" />
                            )}
                          </div>
                        )}
                        {/* Overlay actions */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                          <Button
                            variant="secondary"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleRegenerateCard(card.id)}
                            disabled={regeneratingCardId === card.id}
                            title="Regenerate image"
                          >
                            {regeneratingCardId === card.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <RefreshCw className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="secondary"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setReplacingCardId(card.id);
                              fileInputRef.current?.click();
                            }}
                            disabled={replacingCardId === card.id}
                            title="Replace preview image"
                          >
                            {replacingCardId === card.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Upload className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="secondary"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setDeleteCardId(card.id)}
                            title="Delete card"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
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
                        {card.assetUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExportPng(card)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        )}
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

      {/* Hidden file input for replacing preview image */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && replacingCardId) {
            handleReplacePreviewImage(replacingCardId, file);
          }
          e.target.value = "";
        }}
      />

      {/* Modals */}
      <AddProofModal open={addProofOpen} onOpenChange={setAddProofOpen} />
      <ProofScreenshotModal 
        open={!!viewProof} 
        onOpenChange={(open) => !open && setViewProof(null)} 
        proof={viewProof} 
      />
      <EditProofModal
        open={!!editProof}
        onOpenChange={(open) => !open && setEditProof(null)}
        proof={editProof}
        onSave={handleEditProofSave}
      />

      {/* Delete Proof Card Confirmation Dialog */}
      <AlertDialog open={!!deleteCardId} onOpenChange={(open) => !open && setDeleteCardId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Proof Card?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this proof card and its generated image. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCard} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Proof Confirmation Dialog */}
      <AlertDialog open={!!deleteProofId} onOpenChange={(open) => !open && setDeleteProofId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Proof?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this proof and its screenshot. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProof} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
