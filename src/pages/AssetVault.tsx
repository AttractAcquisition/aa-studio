import { useState, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Upload, 
  Search, 
  Grid, 
  List,
  Image,
  MoreVertical,
  Eye,
  Trash2,
  Copy,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAssets } from "@/hooks/useAssets";
import { UploadAssetsModal } from "@/components/modals/UploadAssetsModal";
import { AssetPreviewModal } from "@/components/modals/AssetPreviewModal";
import { toast } from "sonner";

const tags = ["All", "reel-cover", "proof", "audit", "framework", "lifestyle", "ui"];

export default function AssetVault() {
  const [selectedTag, setSelectedTag] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [previewAsset, setPreviewAsset] = useState<any>(null);

  const { assets, isLoading, uploadAsset, isUploading, deleteAsset } = useAssets(
    selectedTag === "All" ? undefined : selectedTag
  );

  const filteredAssets = assets.filter((asset: any) => {
    const matchesSearch = 
      asset.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.path?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      files.forEach((file) => {
        uploadAsset({ file, tags: selectedTag !== "All" ? [selectedTag] : [], title: file.name });
      });
      toast.success(`Uploading ${files.length} file(s)...`);
    }
  }, [uploadAsset, selectedTag]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDeleteAsset = (id: string) => {
    deleteAsset(id);
    toast.success("Asset deleted");
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copied");
  };

  return (
    <AppLayout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <div className="aa-pill-primary mb-4">Asset Vault</div>
            <h1 className="aa-headline-lg text-foreground">
              Media <span className="aa-gradient-text">Library</span>
            </h1>
            <p className="aa-body mt-2">
              Store, tag, and organize your images and assets.
            </p>
          </div>
          <Button variant="gradient" onClick={() => setUploadModalOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Upload Assets
          </Button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search assets..."
                className="pl-10 w-64"
              />
            </div>

            {/* Tags */}
            <div className="flex items-center gap-2">
              {tags.map((tag) => (
                <Button
                  key={tag}
                  variant={selectedTag === tag ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTag(tag)}
                  className="rounded-full"
                >
                  {tag}
                </Button>
              ))}
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex rounded-xl bg-secondary p-1">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Upload Zone */}
        <div 
          className="mb-8 p-8 rounded-3xl border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer text-center"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => setUploadModalOpen(true)}
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/10 mx-auto mb-4 flex items-center justify-center">
            {isUploading ? (
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            ) : (
              <Upload className="w-8 h-8 text-primary" />
            )}
          </div>
          <p className="font-semibold text-foreground">
            {isUploading ? "Uploading..." : "Drop files here to upload"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">PNG, JPG, GIF up to 10MB</p>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="text-center py-16">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground mt-4">Loading assets...</p>
          </div>
        ) : (
          <>
            {/* Assets Grid */}
            {viewMode === "grid" ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredAssets.map((asset: any) => (
                  <div 
                    key={asset.id} 
                    className="group aa-card p-4 hover:border-primary/30 transition-all cursor-pointer"
                    onClick={() => setPreviewAsset(asset)}
                  >
                    <div className="aspect-square rounded-xl bg-muted mb-3 flex items-center justify-center relative overflow-hidden">
                      {asset.publicUrl ? (
                        <img 
                          src={asset.publicUrl} 
                          alt={asset.title || "Asset"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Image className="w-8 h-8 text-muted-foreground" />
                      )}
                      <div className="absolute inset-0 bg-deep-ink/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button 
                          variant="secondary" 
                          size="icon" 
                          className="w-8 h-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewAsset(asset);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="secondary" 
                          size="icon" 
                          className="w-8 h-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (asset.publicUrl) handleCopyUrl(asset.publicUrl);
                          }}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="font-medium text-sm text-foreground truncate">{asset.title || asset.path}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {asset.tags?.slice(0, 2).map((tag: string) => (
                        <span key={tag} className="aa-pill-outline text-[10px] py-0.5 px-2">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(asset.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredAssets.map((asset: any) => (
                  <div 
                    key={asset.id} 
                    className="flex items-center gap-4 p-4 rounded-2xl bg-secondary/50 hover:bg-secondary transition-colors group cursor-pointer"
                    onClick={() => setPreviewAsset(asset)}
                  >
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center overflow-hidden">
                      {asset.publicUrl ? (
                        <img 
                          src={asset.publicUrl} 
                          alt={asset.title || "Asset"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Image className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{asset.title || asset.path}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {asset.tags?.map((tag: string) => (
                          <span key={tag} className="aa-pill-outline text-[10px] py-0.5 px-2">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(asset.created_at).toLocaleDateString()}
                    </p>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="opacity-0 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAsset(asset.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {filteredAssets.length === 0 && !isLoading && (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-2xl bg-muted mx-auto mb-4 flex items-center justify-center">
                  <Image className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="font-semibold text-foreground">No assets found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchQuery || selectedTag !== "All" 
                    ? "Try adjusting your search or filters" 
                    : "Upload your first asset to get started"
                  }
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <UploadAssetsModal open={uploadModalOpen} onOpenChange={setUploadModalOpen} />
      <AssetPreviewModal 
        open={!!previewAsset} 
        onOpenChange={(open) => !open && setPreviewAsset(null)} 
        asset={previewAsset}
        onDelete={handleDeleteAsset}
      />
    </AppLayout>
  );
}
