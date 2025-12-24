import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { 
  Download, 
  Image, 
  FileText, 
  File,
  CheckCircle,
  RefreshCw,
  Folder,
  ExternalLink
} from "lucide-react";
import { useExports } from "@/hooks/useExports";
import { useContentItems } from "@/hooks/useContentItems";
import { useBrandSettings } from "@/hooks/useBrandSettings";
import { useToast } from "@/hooks/use-toast";
import { formatFilenameFromConvention, uploadBlobToBucket, createAssetRow } from "@/lib/supabase-helpers";
import { useAuth } from "@/hooks/useAuth";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const exportFormats = [
  { type: "Designs", formats: ["PNG 9:16", "PNG 4:5", "PNG 1:1"], icon: Image },
  { type: "Scripts", formats: ["TXT", "DOCX"], icon: FileText },
  { type: "One-Pagers", formats: ["PDF", "PNG"], icon: File },
];

export default function Exports() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { exports, isLoading, createExport, isCreating } = useExports();
  const { contentItems } = useContentItems();
  const { brandSettings } = useBrandSettings();
  const [isExportingAll, setIsExportingAll] = useState(false);

  const handleDownload = (downloadUrl: string | null, filename: string) => {
    if (!downloadUrl) {
      toast({ title: "Error", description: "Download URL not available", variant: "destructive" });
      return;
    }
    
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = filename;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    toast({ title: "Downloaded", description: filename });
  };

  const exportScriptAsTxt = async (contentItem: any) => {
    if (!user || !contentItem.scripts?.[0]) return;
    
    const script = contentItem.scripts[0];
    const blob = new Blob([script.text], { type: "text/plain" });
    
    await createExport({
      contentItemId: contentItem.id,
      kind: "script",
      format: "txt",
      blob,
      series: contentItem.series,
      title: contentItem.title,
    });
  };

  const exportScriptAsDocx = async (contentItem: any) => {
    if (!user || !contentItem.scripts?.[0]) return;
    
    const script = contentItem.scripts[0];
    // Simple DOCX is just text with headers for now
    // Full DOCX generation would require the docx library
    const content = `${contentItem.title || "Script"}\n\n${script.text}`;
    const blob = new Blob([content], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
    
    await createExport({
      contentItemId: contentItem.id,
      kind: "script",
      format: "docx",
      blob,
      series: contentItem.series,
      title: contentItem.title,
    });
  };

  const exportOnePagerAsPdf = async (contentItem: any) => {
    if (!user || !contentItem.one_pagers?.[0]) return;
    
    const onePager = contentItem.one_pagers[0];
    const pdf = new jsPDF();
    
    pdf.setFontSize(20);
    pdf.text(contentItem.title || "One-Pager", 20, 20);
    
    pdf.setFontSize(12);
    const lines = pdf.splitTextToSize(onePager.markdown || "", 170);
    pdf.text(lines, 20, 35);
    
    const pdfBlob = pdf.output("blob");
    
    await createExport({
      contentItemId: contentItem.id,
      kind: "onepager",
      format: "pdf",
      blob: pdfBlob,
      series: contentItem.series,
      title: contentItem.title,
    });
  };

  const handleExportAll = async () => {
    if (!user) return;
    
    setIsExportingAll(true);
    let exportedCount = 0;
    
    try {
      // Get latest 10 content items with scripts
      const itemsWithScripts = contentItems
        .filter(item => item.scripts?.length > 0)
        .slice(0, 10);
      
      for (const item of itemsWithScripts) {
        try {
          await exportScriptAsTxt(item);
          exportedCount++;
        } catch (e) {
          console.error("Export failed for item:", item.id, e);
        }
      }
      
      toast({
        title: "Export complete!",
        description: `Exported ${exportedCount} items.`,
      });
    } catch (error: any) {
      toast({
        title: "Export failed",
        description: error.message || "Some exports failed",
        variant: "destructive",
      });
    } finally {
      setIsExportingAll(false);
    }
  };

  const getFileIcon = (format: string) => {
    if (format.includes("png") || format.includes("image")) return <Image className="w-5 h-5 text-primary" />;
    if (format.includes("txt") || format.includes("docx")) return <FileText className="w-5 h-5 text-primary" />;
    return <File className="w-5 h-5 text-primary" />;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours} hours ago`;
    if (days === 1) return "1 day ago";
    return `${days} days ago`;
  };

  return (
    <AppLayout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <div className="aa-pill-primary mb-4">Exports</div>
            <h1 className="aa-headline-lg text-foreground">
              Export <span className="aa-gradient-text">Center</span>
            </h1>
            <p className="aa-body mt-2">
              Download your designs, scripts, and one-pagers in multiple formats.
            </p>
          </div>
          <Button variant="gradient" onClick={handleExportAll} disabled={isExportingAll || contentItems.length === 0}>
            {isExportingAll ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export All
              </>
            )}
          </Button>
        </div>

        {/* Export Formats */}
        <div className="grid grid-cols-3 gap-6 mb-10">
          {exportFormats.map((format) => (
            <div key={format.type} className="aa-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <format.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-bold text-foreground">{format.type}</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {format.formats.map((f) => (
                  <span key={f} className="aa-pill-outline">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Naming Convention */}
        <div className="aa-card mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Folder className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">Naming Convention</h3>
              <p className="text-sm text-muted-foreground">Automatic file naming for organization</p>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-secondary font-mono text-sm">
            <span className="text-primary">AA</span>
            <span className="text-muted-foreground">_</span>
            <span className="text-accent">[Series]</span>
            <span className="text-muted-foreground">_</span>
            <span className="text-lavender">[Title]</span>
            <span className="text-muted-foreground">_</span>
            <span className="text-foreground">[Format]</span>
            <span className="text-muted-foreground">_</span>
            <span className="text-muted-foreground">[Date]</span>
          </div>
        </div>

        {/* Recent Exports */}
        <div className="aa-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="aa-headline-md text-foreground">Recent Exports</h2>
              <p className="text-sm text-muted-foreground mt-1">Your latest downloaded files</p>
            </div>
            <span className="text-sm text-muted-foreground">{exports.length} exports</span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : exports.length === 0 ? (
            <div className="text-center py-12">
              <File className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No exports yet. Create content to start exporting.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {exports.map((file: any, index: number) => (
                <div 
                  key={file.id} 
                  className="flex items-center gap-4 p-4 rounded-2xl bg-secondary/50 hover:bg-secondary transition-colors group animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    {getFileIcon(file.format)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{file.filename || "Untitled"}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="aa-pill-outline text-[10px]">{file.format?.toUpperCase()}</span>
                      <span className="text-xs text-muted-foreground">{file.kind}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-muted-foreground">{formatDate(file.created_at)}</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="opacity-0 group-hover:opacity-100"
                      onClick={() => handleDownload(file.downloadUrl, file.filename)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    {file.downloadUrl && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100"
                        onClick={() => window.open(file.downloadUrl, "_blank")}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
