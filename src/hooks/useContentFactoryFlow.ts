// Content Factory workflow hook

import { useState, useCallback, useRef } from "react";
import type { Session, User } from "@supabase/supabase-js";
import type {
  DesignAssetKind,
  DesignImages,
  DesignPrompts,
  OnePagerBlock,
} from "@/types/content-factory";
import {
  generateScript as apiGenerateScript,
  generateOnePager as apiGenerateOnePager,
  generateDesignAsset as apiGenerateDesign,
} from "@/lib/content-factory-client";
import {
  extractScriptText,
  extractOnePagerBlocks,
  extractDesignImage,
  generateOnePagerHtml,
} from "@/lib/content-factory-parsers";
import {
  renderNodeToBlob,
  downloadBlob,
  downloadFromUrlOrDataUrl,
  openHtmlInNewTab,
} from "@/lib/export-utils";
import { uploadBlobToBucket, createAssetRow } from "@/lib/supabase-helpers";
import { supabase } from "@/integrations/supabase/client";

type ToastFn = (opts: {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
}) => void;

type CreateExportFn = (params: {
  contentItemId: string;
  kind: string;
  format: string;
  blob: Blob;
  series: string;
  title: string;
}) => Promise<unknown>;

export type UseContentFactoryFlowDeps = {
  user: User | null;
  session: Session | null;
  toast: ToastFn;
  createExport: CreateExportFn;
};

export function useContentFactoryFlow(deps: UseContentFactoryFlowDeps) {
  const { user, session, toast, createExport } = deps;

  // Step state
  const [currentStep, setCurrentStep] = useState(1);
  const [contentItemId, setContentItemId] = useState<string | null>(null);

  // Input state
  const [contentType, setContentType] = useState("");
  const [series, setSeries] = useState("");
  const [hook, setHook] = useState("");
  const [audience, setAudience] = useState("Physical/local businesses");

  // Generated content state
  const [script, setScript] = useState("");
  const [onePagerBlocks, setOnePagerBlocks] = useState<OnePagerBlock[]>([]);
  const [designImages, setDesignImages] = useState<DesignImages>({});
  const [designPrompts, setDesignPrompts] = useState<DesignPrompts>({});

  // Loading state
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingDesignKind, setIsGeneratingDesignKind] =
    useState<DesignAssetKind | null>(null);
  const [isGeneratingPromptKind, setIsGeneratingPromptKind] =
    useState<DesignAssetKind | null>(null);

  // Ref for one-pager document
  const onePagerDocRef = useRef<HTMLDivElement>(null);

  // Computed values
  const wordCount = script.trim().split(/\s+/).filter(Boolean).length;
  const isWordCountValid = wordCount >= 140 && wordCount <= 160;
  const estSeconds = Math.round(wordCount * 0.4);
  const seriesLabel = series ? series.split("-").join(" ") : "Attraction Audit";

  // Reset all state
  const resetState = useCallback(() => {
    setCurrentStep(1);
    setContentItemId(null);
    setContentType("");
    setSeries("");
    setHook("");
    setScript("");
    setOnePagerBlocks([]);
    setDesignImages({});
    setDesignPrompts({});
  }, []);

  // Step 1: Generate Script
  const generateScriptAction = useCallback(async () => {
    if (!user) {
      toast({
        title: "Not signed in",
        description: "Please sign in to generate content.",
        variant: "destructive",
      });
      return;
    }

    if (!contentType || !series) {
      toast({
        title: "Missing fields",
        description: "Please select content type and series",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const data = await apiGenerateScript(
        {
          content_type: contentType,
          series,
          hook: hook || undefined,
          target_audience: audience,
        },
        session,
        user
      );

      setContentItemId(data.run_id);

      const scriptText = extractScriptText(data);
      if (!scriptText) {
        throw new Error(
          "Webhook returned no script text. Ensure your API returns { run_id, script_text }."
        );
      }

      setScript(scriptText);
      
      // Save script to database
      const wc = scriptText.trim().split(/\s+/).filter(Boolean).length;
      const est = Math.round(wc * 0.4);
      
      // Upsert into scripts table
      const { data: existingScript } = await supabase
        .from("scripts")
        .select("id")
        .eq("content_item_id", data.run_id)
        .maybeSingle();
      
      if (existingScript) {
        await supabase
          .from("scripts")
          .update({ text: scriptText, word_count: wc, est_seconds: est })
          .eq("id", existingScript.id);
      } else {
        await supabase
          .from("scripts")
          .insert({
            content_item_id: data.run_id,
            text: scriptText,
            word_count: wc,
            est_seconds: est,
          });
      }
      
      setCurrentStep(2);

      // Reset downstream
      setOnePagerBlocks([]);
      setDesignImages({});

      toast({
        title: "Script generated!",
        description: "Your AI script is ready. Edit as needed.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate script",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  }, [user, session, contentType, series, hook, audience, toast]);

  // Step 2: Generate One-Pager
  const generateOnePagerAction = useCallback(async () => {
    if (!user) {
      toast({
        title: "Not signed in",
        description: "Please sign in to generate content.",
        variant: "destructive",
      });
      return;
    }

    if (!contentItemId) {
      toast({
        title: "Missing run_id",
        description: "Generate a script first (run_id is required).",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const data = await apiGenerateOnePager(contentItemId, session, user);
      const blocks = extractOnePagerBlocks(data);

      if (!blocks.length) {
        throw new Error(
          data.error ||
            "One-pager returned no blocks. Ensure one_pager_agent returns JSON with blocks."
        );
      }

      setOnePagerBlocks(blocks);
      
      // Save one-pager to database
      const { data: existingOnePager } = await supabase
        .from("one_pagers")
        .select("id")
        .eq("content_item_id", contentItemId)
        .maybeSingle();
      
      const blocksJson = { blocks } as Record<string, unknown>;
      const markdown = blocks.map((b: OnePagerBlock) => `## ${b.title || ""}\n${b.body || b.content || ""}`).join("\n\n");
      
      if (existingOnePager) {
        await supabase
          .from("one_pagers")
          .update({ markdown, blocks: blocksJson as any })
          .eq("id", existingOnePager.id);
      } else {
        await supabase
          .from("one_pagers")
          .insert({
            content_item_id: contentItemId,
            markdown,
            blocks: blocksJson as any,
          });
      }
      
      setDesignImages({});
      setCurrentStep(3);

      toast({
        title: "One-Pager generated!",
        description: "Preview is ready.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to generate one-pager",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  }, [user, session, contentItemId, toast]);

  // Step 3: Export One-Pager PNG
  const exportOnePagerPng = useCallback(async () => {
    if (!onePagerDocRef.current) {
      toast({
        title: "Nothing to export",
        description: "Generate the one-pager first.",
        variant: "destructive",
      });
      return;
    }

    try {
      const blob = await renderNodeToBlob(onePagerDocRef.current, "#ffffff");
      downloadBlob(blob, `aa_one_pager_${Date.now()}.png`);

      toast({
        title: "Exported",
        description: "Downloaded your one-pager PNG.",
      });
    } catch (e) {
      toast({
        title: "Export failed",
        description: e instanceof Error ? e.message : "Could not export PNG.",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Step 3: View in New Tab
  const viewOnePagerNewTab = useCallback(() => {
    if (!onePagerBlocks?.length) {
      toast({
        title: "Nothing to view",
        description: "Generate the one-pager first.",
        variant: "destructive",
      });
      return;
    }

    const html = generateOnePagerHtml(onePagerBlocks, {
      hook,
      series,
      audience,
    });
    openHtmlInNewTab(html);
  }, [onePagerBlocks, hook, series, audience, toast]);

  // Step 4: Generate Design Prompt (Step 1 of 2-step flow)
  const generateDesignPrompt = useCallback(
    async (kind: DesignAssetKind) => {
      if (!user) {
        toast({
          title: "Not signed in",
          description: "Please sign in to generate designs.",
          variant: "destructive",
        });
        return;
      }

      setIsGeneratingPromptKind(kind);

      try {
        const response = await fetch(
          `https://dwhmvzooerxejustfqpt.supabase.co/functions/v1/generate-design-prompt`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              kind,
              hook,
              series,
              audience,
              script,
              onePagerBlocks,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Failed to generate prompt' }));
          throw new Error(errorData.error || 'Failed to generate prompt');
        }

        const data = await response.json();
        
        if (!data.prompt) {
          throw new Error('No prompt returned from API');
        }

        setDesignPrompts((prev) => ({ ...prev, [kind]: data.prompt }));

        toast({
          title: "Prompt generated",
          description: "Edit the prompt if needed, then click Generate Image.",
        });
      } catch (e) {
        toast({
          title: "Prompt generation failed",
          description: e instanceof Error ? e.message : "Could not generate prompt.",
          variant: "destructive",
        });
      } finally {
        setIsGeneratingPromptKind(null);
      }
    },
    [user, hook, series, audience, script, onePagerBlocks, toast]
  );

  // Step 4: Generate Design Image (Step 2 of 2-step flow)
  const generateDesignImage = useCallback(
    async (kind: DesignAssetKind, customPrompt?: string) => {
      if (!user) {
        toast({
          title: "Not signed in",
          description: "Please sign in to generate designs.",
          variant: "destructive",
        });
        return;
      }

      const prompt = customPrompt || designPrompts[kind];
      if (!prompt) {
        toast({
          title: "No prompt",
          description: "Generate a prompt first.",
          variant: "destructive",
        });
        return;
      }

      setIsGeneratingDesignKind(kind);

      try {
        const response = await fetch(
          `https://dwhmvzooerxejustfqpt.supabase.co/functions/v1/generate-design-image`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, kind }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Failed to generate image' }));
          throw new Error(errorData.error || 'Failed to generate image');
        }

        const data = await response.json();
        
        if (!data.image_data_url) {
          throw new Error('No image returned from API');
        }

        setDesignImages((prev) => ({ ...prev, [kind]: data.image_data_url }));
        
        // Save design to database if we have a content item
        if (contentItemId) {
          const ratio = kind === "bold_text_card" ? "1:1" : kind === "reel_cover" ? "9:16" : "4:5";
          await supabase
            .from("designs")
            .insert({
              content_item_id: contentItemId,
              format: ratio,
              design_json: { kind, ratio, prompt: prompt.substring(0, 500) } as any,
            });
        }

        toast({
          title: "Image generated",
          description: "Design image ready.",
        });
      } catch (e) {
        toast({
          title: "Image generation failed",
          description: e instanceof Error ? e.message : "Could not generate image.",
          variant: "destructive",
        });
      } finally {
        setIsGeneratingDesignKind(null);
      }
    },
    [user, contentItemId, designPrompts, toast]
  );

  // Update design prompt (for editing in textarea)
  const setDesignPrompt = useCallback((kind: DesignAssetKind, prompt: string) => {
    setDesignPrompts((prev) => ({ ...prev, [kind]: prompt }));
  }, []);

  // Legacy: Generate Design Asset (keeping for backwards compatibility if needed)
  const generateDesign = useCallback(
    async (kind: DesignAssetKind) => {
      // Now just calls the 2-step flow: generate prompt then image
      await generateDesignPrompt(kind);
    },
    [generateDesignPrompt]
  );

  // Step 4: Export single image
  const exportSingleImage = useCallback(
    async (url: string | null | undefined, basename: string) => {
      if (!url) {
        toast({
          title: "Nothing to export",
          description: "Generate the image first.",
          variant: "destructive",
        });
        return;
      }

      try {
        await downloadFromUrlOrDataUrl(url, `${basename}_${Date.now()}.png`);
        toast({ title: "Exported", description: "Downloaded PNG." });
      } catch (e) {
        toast({
          title: "Export failed",
          description: e instanceof Error ? e.message : "Could not export PNG.",
          variant: "destructive",
        });
      }
    },
    [toast]
  );

  // Step 4: Save & Export ALL 3 images
  const saveAndExportAll = useCallback(async () => {
    if (!user) {
      toast({
        title: "Not signed in",
        description: "Please sign in to export designs.",
        variant: "destructive",
      });
      return;
    }

    if (!onePagerBlocks?.length) {
      toast({
        title: "Nothing to export",
        description: "Generate the one-pager first.",
        variant: "destructive",
      });
      return;
    }

    const boldUrl = designImages.bold_text_card;
    const reelUrl = designImages.reel_cover;
    const coverUrl = designImages.one_pager_cover;

    if (!boldUrl || !reelUrl || !coverUrl) {
      toast({
        title: "Export failed",
        description:
          "Generate all 3 images first (Bold Text Card, Reel Cover, One-Pager Cover).",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const { urlToBlob } = await import("@/lib/export-utils");
      const baseTitle = (hook || contentType || "design").toString();
      const runId = contentItemId || "temp";

      const items: Array<{
        key: DesignAssetKind;
        format: "1:1" | "9:16" | "4:5";
        url: string;
        filenameBase: string;
      }> = [
        {
          key: "bold_text_card",
          format: "1:1",
          url: boldUrl,
          filenameBase: "aa_bold_text_card",
        },
        {
          key: "reel_cover",
          format: "9:16",
          url: reelUrl,
          filenameBase: "aa_reel_cover",
        },
        {
          key: "one_pager_cover",
          format: "4:5",
          url: coverUrl,
          filenameBase: "aa_one_pager_cover",
        },
      ];

      let successCount = 0;

      for (const item of items) {
        const blob = await urlToBlob(item.url);
        const filename = `${item.filenameBase}_${Date.now()}_${item.format}.png`;

        const uploaded = await uploadBlobToBucket(
          "aa-designs",
          blob,
          user.id,
          filename
        );
        if (!uploaded) throw new Error(`Upload failed (${item.key})`);

        const asset = await createAssetRow(
          user.id,
          "aa-designs",
          uploaded.path,
          "design",
          [item.key, item.format],
          filename
        );
        if (!asset) throw new Error(`Asset creation failed (${item.key})`);

        await createExport({
          contentItemId: runId,
          kind: item.key,
          format: item.format,
          blob,
          series,
          title: baseTitle,
        });

        successCount += 1;
      }

      toast({
        title: "Export saved!",
        description: `Saved ${successCount}/3 designs to your vault.`,
      });

      // Reset
      resetState();
    } catch (error) {
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Failed to export designs",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [
    user,
    onePagerBlocks,
    designImages,
    hook,
    contentType,
    contentItemId,
    series,
    createExport,
    resetState,
    toast,
  ]);

  return {
    // State
    currentStep,
    contentItemId,
    contentType,
    series,
    hook,
    audience,
    script,
    onePagerBlocks,
    designImages,
    designPrompts,
    isGenerating,
    isSaving,
    isGeneratingDesignKind,
    isGeneratingPromptKind,

    // Computed
    wordCount,
    isWordCountValid,
    estSeconds,
    seriesLabel,

    // Ref
    onePagerDocRef,

    // Setters
    setCurrentStep,
    setContentType,
    setSeries,
    setHook,
    setAudience,
    setScript,
    setDesignPrompt,

    // Actions
    generateScript: generateScriptAction,
    generateOnePager: generateOnePagerAction,
    generateDesign,
    generateDesignPrompt,
    generateDesignImage,
    exportOnePagerPng,
    viewOnePagerNewTab,
    exportSingleImage,
    saveAndExportAll,
    resetState,
  };
}
