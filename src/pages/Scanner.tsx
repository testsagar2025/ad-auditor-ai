import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, Image, Loader2, AlertCircle, CheckCircle, FileText } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { ExtractedAdData } from "@/types/database";

type ScanStep = "upload" | "processing" | "review" | "submitted";

export default function Scanner() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<ScanStep>("upload");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedAdData | null>(null);
  const [manualData, setManualData] = useState({
    topper_name: "",
    rank_claimed: "",
    exam_name: "",
    exam_year: new Date().getFullYear(),
    institute_name: "",
    fine_print: "",
    newspaper_name: "",
  });

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file",
          variant: "destructive",
        });
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  }, []);

  const processImage = async () => {
    if (!imageFile || !imagePreview) return;

    setIsProcessing(true);
    setStep("processing");

    try {
      // Call the AI edge function to extract data
      const { data, error } = await supabase.functions.invoke("extract-ad-data", {
        body: { image: imagePreview },
      });

      if (error) throw error;

      if (data?.extracted) {
        setExtractedData(data.extracted);
        setManualData({
          topper_name: data.extracted.topper_name || "",
          rank_claimed: data.extracted.rank_claimed || "",
          exam_name: data.extracted.exam_name || "",
          exam_year: data.extracted.exam_year || new Date().getFullYear(),
          institute_name: data.extracted.institute_name || "",
          fine_print: data.extracted.fine_print || "",
          newspaper_name: "",
        });
      }

      setStep("review");
    } catch (error) {
      console.error("Error processing image:", error);
      toast({
        title: "Processing failed",
        description: "Could not extract data. Please enter details manually.",
        variant: "destructive",
      });
      setStep("review");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async () => {
    if (!imageFile) return;

    setIsProcessing(true);

    try {
      // Upload image to storage
      const fileName = `${Date.now()}-${imageFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("newspaper-ads")
        .upload(fileName, imageFile);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("newspaper-ads")
        .getPublicUrl(fileName);

      // Check if institute exists or create new
      let instituteId: string | null = null;

      if (manualData.institute_name) {
        const { data: existing } = await supabase
          .from("coaching_institutes")
          .select("id")
          .ilike("name", manualData.institute_name)
          .maybeSingle();

        if (existing) {
          instituteId = existing.id;
        } else {
          const { data: newInstitute, error: instituteError } = await supabase
            .from("coaching_institutes")
            .insert({ name: manualData.institute_name })
            .select()
            .single();

          if (instituteError) throw instituteError;
          instituteId = newInstitute.id;
        }
      }

      // Create the claim
      const { error: claimError } = await supabase.from("topper_claims").insert({
        institute_id: instituteId,
        topper_name: manualData.topper_name,
        rank_claimed: manualData.rank_claimed,
        exam_name: manualData.exam_name || null,
        exam_year: manualData.exam_year || null,
        fine_print: manualData.fine_print || null,
        newspaper_name: manualData.newspaper_name || null,
        newspaper_image_url: urlData.publicUrl,
        extracted_text: extractedData ? JSON.stringify(extractedData) : null,
      });

      if (claimError) throw claimError;

      // Trigger conflict detection
      await supabase.functions.invoke("detect-conflicts", {
        body: {
          topper_name: manualData.topper_name,
          rank_claimed: manualData.rank_claimed,
          exam_year: manualData.exam_year,
        },
      });

      setStep("submitted");
      toast({
        title: "Success!",
        description: "Your submission has been recorded anonymously.",
      });
    } catch (error) {
      console.error("Submission error:", error);
      toast({
        title: "Submission failed",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Layout>
      <div className="container py-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Newspaper Ad Scanner</h1>
          <p className="text-muted-foreground">
            Upload a coaching advertisement photo. AI will extract topper claims for verification.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-2 mb-8">
          {["upload", "processing", "review", "submitted"].map((s, i) => (
            <div key={s} className="flex items-center">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === s
                    ? "bg-primary text-primary-foreground"
                    : ["upload", "processing", "review", "submitted"].indexOf(step) > i
                    ? "bg-success text-success-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {["upload", "processing", "review", "submitted"].indexOf(step) > i ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  i + 1
                )}
              </div>
              {i < 3 && (
                <div
                  className={`h-1 w-12 mx-2 ${
                    ["upload", "processing", "review", "submitted"].indexOf(step) > i
                      ? "bg-success"
                      : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        {step === "upload" && (
          <Card>
            <CardHeader>
              <CardTitle>Upload Advertisement</CardTitle>
              <CardDescription>
                Drag and drop or click to upload a newspaper advertisement photo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  imagePreview ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}
              >
                {imagePreview ? (
                  <div className="space-y-4">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-h-64 mx-auto rounded-lg"
                    />
                    <p className="text-sm text-muted-foreground">{imageFile?.name}</p>
                    <Button variant="outline" onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                    }}>
                      Remove
                    </Button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-medium mb-1">Drop your image here</p>
                    <p className="text-sm text-muted-foreground">or click to browse</p>
                  </label>
                )}
              </div>

              {imagePreview && (
                <Button className="w-full mt-4" onClick={processImage}>
                  <Image className="h-4 w-4 mr-2" />
                  Scan with AI
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {step === "processing" && (
          <Card>
            <CardContent className="py-16 text-center">
              <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">Processing Image</h3>
              <p className="text-muted-foreground">
                AI is extracting topper names, ranks, and fine print...
              </p>
            </CardContent>
          </Card>
        )}

        {step === "review" && (
          <Card>
            <CardHeader>
              <CardTitle>Review & Confirm</CardTitle>
              <CardDescription>
                Verify the extracted information and correct if needed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {imagePreview && (
                <div className="mb-6">
                  <img
                    src={imagePreview}
                    alt="Uploaded ad"
                    className="max-h-48 rounded-lg mx-auto"
                  />
                </div>
              )}

              {extractedData && extractedData.confidence < 0.7 && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 text-warning text-sm">
                  <AlertCircle className="h-4 w-4" />
                  Low confidence extraction. Please verify all fields.
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="institute">Institute Name *</Label>
                  <Input
                    id="institute"
                    value={manualData.institute_name}
                    onChange={(e) =>
                      setManualData({ ...manualData, institute_name: e.target.value })
                    }
                    placeholder="e.g., ABC Coaching"
                  />
                </div>
                <div>
                  <Label htmlFor="topper">Topper Name *</Label>
                  <Input
                    id="topper"
                    value={manualData.topper_name}
                    onChange={(e) =>
                      setManualData({ ...manualData, topper_name: e.target.value })
                    }
                    placeholder="e.g., John Doe"
                  />
                </div>
                <div>
                  <Label htmlFor="rank">Rank Claimed *</Label>
                  <Input
                    id="rank"
                    value={manualData.rank_claimed}
                    onChange={(e) =>
                      setManualData({ ...manualData, rank_claimed: e.target.value })
                    }
                    placeholder="e.g., AIR 5"
                  />
                </div>
                <div>
                  <Label htmlFor="exam">Exam Name</Label>
                  <Input
                    id="exam"
                    value={manualData.exam_name}
                    onChange={(e) =>
                      setManualData({ ...manualData, exam_name: e.target.value })
                    }
                    placeholder="e.g., IIT-JEE Advanced"
                  />
                </div>
                <div>
                  <Label htmlFor="year">Exam Year</Label>
                  <Input
                    id="year"
                    type="number"
                    value={manualData.exam_year}
                    onChange={(e) =>
                      setManualData({ ...manualData, exam_year: parseInt(e.target.value) })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="newspaper">Newspaper Name</Label>
                  <Input
                    id="newspaper"
                    value={manualData.newspaper_name}
                    onChange={(e) =>
                      setManualData({ ...manualData, newspaper_name: e.target.value })
                    }
                    placeholder="e.g., Times of India"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="fineprint">Fine Print / Disclaimers</Label>
                <Textarea
                  id="fineprint"
                  value={manualData.fine_print}
                  onChange={(e) =>
                    setManualData({ ...manualData, fine_print: e.target.value })
                  }
                  placeholder="Any small text or disclaimers found in the ad..."
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setStep("upload")}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={
                    isProcessing ||
                    !manualData.topper_name ||
                    !manualData.rank_claimed ||
                    !manualData.institute_name
                  }
                  className="flex-1"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Submit Claim
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "submitted" && (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Submission Recorded!</h3>
              <p className="text-muted-foreground mb-6">
                Your anonymous submission is now part of the database. Conflicts will be
                automatically detected.
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => navigate("/store")}>
                  View The Store
                </Button>
                <Button onClick={() => {
                  setStep("upload");
                  setImageFile(null);
                  setImagePreview(null);
                  setExtractedData(null);
                }}>
                  Upload Another
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Privacy Notice */}
        <p className="text-xs text-muted-foreground text-center mt-8">
          🔒 Your submission is 100% anonymous. We do not track users or store any identifying information.
        </p>
      </div>
    </Layout>
  );
}
