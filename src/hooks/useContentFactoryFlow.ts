// Content Factory workflow hook

import { useState, useCallback, useRef } from "react";
import type { Session, User } from "@supabase/supabase-js";
import type {
  DesignAssetKind,
  DesignImages,
  DesignPrompts,
  OnePagerBlock,
} from "@/types/content-factory";
import type { OnePagerLayout, OnePagerTemplateId } from "@/types/one-pager-layout";
import { validateOnePagerLayout } from "@/types/one-pager-layout";
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
  renderOnePagerToBlob,
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
  const [bundleId, setBundleId] = useState<string | null>(null);

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
  
  // New one-pager layout system
  const [onePagerLayout, setOnePagerLayout] = useState<OnePagerLayout | null>(null);
  const [onePagerLayoutJson, setOnePagerLayoutJson] = useState<string>("");
  const [onePagerLayoutError, setOnePagerLayoutError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<OnePagerTemplateId>("auto");
  const [isGeneratingLayout, setIsGeneratingLayout] = useState(false);

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

  // Helper to update bundle
  const updateBundle = useCallback(async (data: Record<string, any>) => {
    if (!bundleId || !user) return;
    try {
      await supabase
        .from("content_bundles")
        .update(data)
        .eq("id", bundleId)
        .eq("user_id", user.id);
    } catch (e) {
      console.error("Failed to update bundle:", e);
    }
  }, [bundleId, user]);

  // Reset all state
  const resetState = useCallback(() => {
    setCurrentStep(1);
    setContentItemId(null);
    setBundleId(null);
    setContentType("");
    setSeries("");
    setHook("");
    setScript("");
    setOnePagerBlocks([]);
    setOnePagerLayout(null);
    setOnePagerLayoutJson("");
    setOnePagerLayoutError(null);
    setSelectedTemplate("auto");
    setDesignImages({});
    setDesignPrompts({});
  }, []);

  // Generate One-Pager Layout (new JSON-based system)
  const generateOnePagerLayout = useCallback(async () => {
    if (!user || !script) {
      toast({
        title: "Missing data",
        description: "Script is required to generate layout.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingLayout(true);
    setOnePagerLayoutError(null);

    try {
      const response = await fetch(
        `https://dwhmvzooerxejustfqpt.supabase.co/functions/v1/generate-onepager-layout`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            script,
            hook,
            series,
            audience,
            templateId: selectedTemplate,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to generate layout' }));
        throw new Error(errorData.error || 'Failed to generate layout');
      }

      const data = await response.json();
      
      if (!data.layout) {
        throw new Error(data.error || 'No layout returned');
      }

      const jsonStr = JSON.stringify(data.layout, null, 2);
      setOnePagerLayoutJson(jsonStr);
      
      const validation = validateOnePagerLayout(data.layout);
      if (validation.success && validation.data) {
        setOnePagerLayout(validation.data);
        setOnePagerLayoutError(null);
      } else {
        setOnePagerLayoutError(validation.error || 'Invalid layout');
        setOnePagerLayout(null);
      }

      setCurrentStep(3);
      toast({ title: "Layout generated!", description: "Edit JSON if needed, then preview." });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to generate layout";
      setOnePagerLayoutError(msg);
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setIsGeneratingLayout(false);
    }
  }, [user, script, hook, series, audience, selectedTemplate, toast]);

  // Update layout from JSON editor
  const updateLayoutFromJson = useCallback((jsonStr: string) => {
    setOnePagerLayoutJson(jsonStr);
    try {
      const parsed = JSON.parse(jsonStr);
      const validation = validateOnePagerLayout(parsed);
      if (validation.success && validation.data) {
        setOnePagerLayout(validation.data);
        setOnePagerLayoutError(null);
      } else {
        setOnePagerLayoutError(validation.error || 'Invalid layout');
      }
    } catch {
      setOnePagerLayoutError('Invalid JSON syntax');
    }
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
      
      // Create bundle if missing
      const title = hook || `${contentType} - ${series}`;
      const { data: newBundle, error: bundleError } = await supabase
        .from("content_bundles")
        .insert({
          user_id: user.id,
          title,
          series,
          content_type: contentType,
          audience,
          hook: hook || null,
          script: scriptText,
        })
        .select()
        .single();
      
      if (!bundleError && newBundle) {
        setBundleId(newBundle.id);
      }
      
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

  // Step 3: Export One-Pager PNG (fixed for proper rendering)
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
      // Use fixed width export for consistent quality
      const blob = await renderOnePagerToBlob(onePagerDocRef.current, 1080);
      downloadBlob(blob, `aa_one_pager_${Date.now()}.png`);

      toast({
        title: "Exported",
        description: "Downloaded your one-pager PNG.",
      });

      return blob;
    } catch (e) {
      toast({
        title: "Export failed",
        description: e instanceof Error ? e.message : "Could not export PNG.",
        variant: "destructive",
      });
      return null;
    }
  }, [toast]);

  // Step 3: Save One-Pager to Library (one_pagers_v2 table)
  const [isSavingOnePager, setIsSavingOnePager] = useState(false);

  const saveOnePagerToLibrary = useCallback(async () => {
    if (!user || !onePagerLayout) {
      toast({
        title: "Nothing to save",
        description: "Generate a valid one-pager first.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingOnePager(true);

    try {
      // Generate title from hook, first section heading, or default
      let title = "One-Pager";
      if (hook) {
        title = hook.slice(0, 100);
      } else if (onePagerLayout.meta?.title) {
        title = onePagerLayout.meta.title;
      } else if (onePagerLayout.sections?.[0]?.heading) {
        title = onePagerLayout.sections[0].heading;
      }

      // Export PNG and upload to storage
      let exportPngUrl: string | null = null;
      if (onePagerDocRef.current) {
        try {
          const blob = await renderOnePagerToBlob(onePagerDocRef.current, 1080);
          const filename = `${Date.now()}_onepager.png`;
          const result = await uploadBlobToBucket("aa-onepagers", blob, user.id, filename);
          
          if (result) {
            exportPngUrl = result.publicUrl;
          }
        } catch (uploadErr) {
          console.warn("Failed to upload PNG, saving without image:", uploadErr);
        }
      }

      // Insert into one_pagers_v2
      const { error } = await supabase.from("one_pagers_v2").insert({
        user_id: user.id,
        title,
        layout_json: onePagerLayout as any,
        template_id: selectedTemplate || null,
        export_png_url: exportPngUrl,
        tags: series ? [series] : [],
      });

      if (error) throw error;

      toast({
        title: "Saved to One-Pagers",
        description: "Your one-pager is now in your library.",
      });
    } catch (e) {
      toast({
        title: "Save failed",
        description: e instanceof Error ? e.message : "Could not save one-pager.",
        variant: "destructive",
      });
    } finally {
      setIsSavingOnePager(false);
    }
  }, [user, onePagerLayout, hook, selectedTemplate, series, toast]);

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
        
        // Update bundle with design image
        if (bundleId) {
          const currentImages = designImages || {};
          await supabase
            .from("content_bundles")
            .update({
              design_image_urls: { ...currentImages, [kind]: data.image_data_url },
            })
            .eq("id", bundleId);
        }
        
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

    // Check for either new layout system or legacy blocks
    const hasContent = onePagerLayout !== null || (onePagerBlocks && onePagerBlocks.length > 0);
    if (!hasContent && !script) {
      toast({
        title: "Nothing to export",
        description: "Generate content first.",
        variant: "destructive",
      });
      return;
    }

    const boldUrl = designImages.bold_text_card;
    const reelUrl = designImages.reel_cover;
    const coverUrl = designImages.one_pager_cover;

    // Build list of available images only
    const availableImages: Array<{
      key: DesignAssetKind;
      format: "1:1" | "9:16" | "4:5";
      url: string;
      filenameBase: string;
    }> = [];

    if (boldUrl) {
      availableImages.push({
        key: "bold_text_card",
        format: "1:1",
        url: boldUrl,
        filenameBase: "aa_bold_text_card",
      });
    }
    if (reelUrl) {
      availableImages.push({
        key: "reel_cover",
        format: "9:16",
        url: reelUrl,
        filenameBase: "aa_reel_cover",
      });
    }
    if (coverUrl) {
      availableImages.push({
        key: "one_pager_cover",
        format: "4:5",
        url: coverUrl,
        filenameBase: "aa_one_pager_cover",
      });
    }

    if (availableImages.length === 0) {
      toast({
        title: "Nothing to export",
        description: "Generate at least one design image first.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const { urlToBlob } = await import("@/lib/export-utils");
      const baseTitle = (hook || contentType || "design").toString();

      let successCount = 0;

      for (const item of availableImages) {
        try {
          console.log(`Processing ${item.key}...`);
          const blob = await urlToBlob(item.url);
          const filename = `${item.filenameBase}_${Date.now()}_${item.format.replace(":", "x")}.png`;

          const uploaded = await uploadBlobToBucket(
            "aa-designs",
            blob,
            user.id,
            filename
          );
          
          if (!uploaded) {
            console.error(`Upload failed for ${item.key}`);
            continue;
          }

          const asset = await createAssetRow(
            user.id,
            "aa-designs",
            uploaded.path,
            "design",
            [item.key, item.format],
            filename
          );
          
          if (!asset) {
            console.error(`Asset creation failed for ${item.key}`);
            continue;
          }

          // Only create export record if we have a valid content item ID
          if (contentItemId) {
            await createExport({
              contentItemId,
              kind: item.key,
              format: item.format,
              blob,
              series,
              title: baseTitle,
            });
          }

          successCount += 1;
        } catch (itemError) {
          console.error(`Error processing ${item.key}:`, itemError);
        }
      }

      if (successCount === 0) {
        throw new Error("Failed to save any designs");
      }

      toast({
        title: "Export saved!",
        description: `Saved ${successCount}/${availableImages.length} designs to your vault.`,
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
    onePagerLayout,
    script,
    designImages,
    hook,
    contentType,
    contentItemId,
    series,
    createExport,
    resetState,
    toast,
  ]);

  // Save script to script_library table
  const saveScriptToLibrary = useCallback(async () => {
    if (!user || !script) {
      toast({
        title: "Cannot save",
        description: "No script to save.",
        variant: "destructive",
      });
      return;
    }

    try {
      const title = hook || `${seriesLabel} Script`;
      const wc = script.trim().split(/\s+/).filter(Boolean).length;

      await supabase.from("script_library").insert({
        user_id: user.id,
        title,
        body: script,
        hook: hook || null,
        platform: "instagram",
        status: "draft",
        word_count: wc,
        tags: series ? [series] : [],
      });

      toast({
        title: "Saved to Scripts",
        description: "Script added to your library.",
      });
    } catch (e) {
      toast({
        title: "Save failed",
        description: e instanceof Error ? e.message : "Could not save script.",
        variant: "destructive",
      });
    }
  }, [user, script, hook, seriesLabel, series, toast]);

  // Export script as .txt file
  const exportScriptTxt = useCallback(() => {
    if (!script) {
      toast({
        title: "Nothing to export",
        description: "No script available.",
        variant: "destructive",
      });
      return;
    }

    try {
      const blob = new Blob([script], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${hook || seriesLabel || "script"}_${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Exported",
        description: "Script downloaded as .txt file.",
      });
    } catch (e) {
      toast({
        title: "Export failed",
        description: e instanceof Error ? e.message : "Could not export script.",
        variant: "destructive",
      });
    }
  }, [script, hook, seriesLabel, toast]);

  // Skip to manual script entry (Step 2 with empty script)
  const skipToManualScript = useCallback(() => {
    setScript("");
    setContentType("");
    setSeries("");
    setHook("");
    setCurrentStep(2);
  }, []);

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
    
    // New layout system
    onePagerLayout,
    onePagerLayoutJson,
    onePagerLayoutError,
    selectedTemplate,
    isGeneratingLayout,
    isSavingOnePager,

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
    setSelectedTemplate,

    // Actions
    generateScript: generateScriptAction,
    generateOnePager: generateOnePagerAction,
    generateOnePagerLayout,
    updateLayoutFromJson,
    generateDesign,
    generateDesignPrompt,
    generateDesignImage,
    exportOnePagerPng,
    viewOnePagerNewTab,
    exportSingleImage,
    saveAndExportAll,
    resetState,
    saveScriptToLibrary,
    exportScriptTxt,
    skipToManualScript,
    saveOnePagerToLibrary,
  };
}
