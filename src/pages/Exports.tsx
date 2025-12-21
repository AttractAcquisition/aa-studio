import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { 
  Download, 
  Image, 
  FileText, 
  File,
  CheckCircle,
  Clock,
  Folder
} from "lucide-react";
import { cn } from "@/lib/utils";

const recentExports = [
  { id: 1, name: "AA_FixMyFunnel_HookFormula_9x16_2024-12-18", type: "PNG", size: "2.4 MB", status: "complete", date: "2 hours ago" },
  { id: 2, name: "AA_AttractionAudit_AuditResults_Script_2024-12-18", type: "TXT", size: "4 KB", status: "complete", date: "3 hours ago" },
  { id: 3, name: "AA_UnavoidableBrand_BrandModel_4x5_2024-12-17", type: "PNG", size: "1.8 MB", status: "complete", date: "1 day ago" },
  { id: 4, name: "AA_AdCreative_Tips_OnePager_2024-12-17", type: "PDF", size: "856 KB", status: "complete", date: "1 day ago" },
  { id: 5, name: "AA_NoiseToBookings_CaseStudy_9x16_2024-12-15", type: "PNG", size: "3.1 MB", status: "complete", date: "3 days ago" },
];

const exportFormats = [
  { type: "Designs", formats: ["PNG 9:16", "PNG 4:5", "PNG 1:1"], icon: Image },
  { type: "Scripts", formats: ["TXT", "DOCX"], icon: FileText },
  { type: "One-Pagers", formats: ["PDF", "PNG"], icon: File },
];

export default function Exports() {
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
          <Button variant="gradient">
            <Download className="w-4 h-4 mr-2" />
            Export All
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
            <Button variant="outline" size="sm">View All</Button>
          </div>

          <div className="space-y-3">
            {recentExports.map((file, index) => (
              <div 
                key={file.id} 
                className="flex items-center gap-4 p-4 rounded-2xl bg-secondary/50 hover:bg-secondary transition-colors group animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  {file.type === "PNG" && <Image className="w-5 h-5 text-primary" />}
                  {file.type === "TXT" && <FileText className="w-5 h-5 text-primary" />}
                  {file.type === "PDF" && <File className="w-5 h-5 text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{file.name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="aa-pill-outline text-[10px]">{file.type}</span>
                    <span className="text-xs text-muted-foreground">{file.size}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-muted-foreground">{file.date}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
