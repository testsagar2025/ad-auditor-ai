import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Upload, 
  Image, 
  Loader2, 
  AlertCircle, 
  CheckCircle, 
  FileText,
  Plus,
  Trash2,
  Users
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { ExtractedAdData, ExtractedStudent } from "@/types/database";

type ScanStep = "upload" | "processing" | "review" | "submitted";

interface StudentFormData {
  id: string;
  topper_name: string;
  rank_claimed: string;
  exam_name: string;
  exam_year: number;
  fine_print: string;
}

const createEmptyStudent = (): StudentFormData => ({
  id: crypto.randomUUID(),
  topper_name: "",
  rank_claimed: "",
  exam_name: "",
  exam_year: new Date().getFullYear(),
  fine_print: "",
});

export default function Scanner() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<ScanStep>("upload");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedAdData | null>(null);
  
  // Form data
  const [instituteName, setInstituteName] = useState("");
  const [newspaperName, setNewspaperName] = useState("");
  const [students, setStudents] = useState<StudentFormData[]>([createEmptyStudent()]);

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
      const { data, error } = await supabase.functions.invoke("extract-ad-data", {
        body: { image: imagePreview },
      });

      if (error) throw error;

      if (data?.extracted) {
        const extracted = data.extracted as ExtractedAdData;
        setExtractedData(extracted);
        setInstituteName(extracted.institute_name || "");
        
        if (extracted.students && extracted.students.length > 0) {
          setStudents(extracted.students.map((s: ExtractedStudent) => ({
            id: crypto.randomUUID(),
            topper_name: s.topper_name || "",
            rank_claimed: s.rank_claimed || "",
            exam_name: s.exam_name || "",
            exam_year: s.exam_year || new Date().getFullYear(),
            fine_print: s.fine_print || "",
          })));
        }
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

  const addStudent = () => {
    setStudents([...students, createEmptyStudent()]);
  };

  const removeStudent = (id: string) => {
    if (students.length > 1) {
      setStudents(students.filter(s => s.id !== id));
    }
  };

  const updateStudent = (id: string, field: keyof StudentFormData, value: string | number) => {
    setStudents(students.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ));
  };

  const handleSubmit = async () => {
    if (!imageFile) return;

    // Validate at least one complete student
    const validStudents = students.filter(s => s.topper_name && s.rank_claimed);
    if (validStudents.length === 0) {
      toast({
        title: "Missing information",
        description: "Please add at least one student with name and rank",
        variant: "destructive",
      });
      return;
    }

    if (!instituteName) {
      toast({
        title: "Missing information",
        description: "Please enter the institute name",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Upload image to storage
      const fileName = `${Date.now()}-${imageFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("newspaper-ads")
        .upload(fileName, imageFile);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("newspaper-ads")
        .getPublicUrl(fileName);

      // Check if institute exists or create new
      let instituteId: string | null = null;

      const { data: existing } = await supabase
        .from("coaching_institutes")
        .select("id, total_claims")
        .ilike("name", instituteName)
        .maybeSingle();

      if (existing) {
        instituteId = existing.id;
        // Update total claims count
        await supabase
          .from("coaching_institutes")
          .update({ total_claims: (existing.total_claims || 0) + validStudents.length })
          .eq("id", existing.id);
      } else {
        const { data: newInstitute, error: instituteError } = await supabase
          .from("coaching_institutes")
          .insert({ name: instituteName, total_claims: validStudents.length })
          .select()
          .single();

        if (instituteError) throw instituteError;
        instituteId = newInstitute.id;
      }

      // Create claims for each student
      for (const student of validStudents) {
        const { error: claimError } = await supabase.from("topper_claims").insert({
          institute_id: instituteId,
          topper_name: student.topper_name,
          rank_claimed: student.rank_claimed,
          exam_name: student.exam_name || null,
          exam_year: student.exam_year || null,
          fine_print: student.fine_print || null,
          newspaper_name: newspaperName || null,
          newspaper_image_url: urlData.publicUrl,
          extracted_text: extractedData ? JSON.stringify(extractedData) : null,
        });

        if (claimError) throw claimError;

        // Trigger conflict detection for each student
        await supabase.functions.invoke("detect-conflicts", {
          body: {
            topper_name: student.topper_name,
            rank_claimed: student.rank_claimed,
            exam_year: student.exam_year,
          },
        });
      }

      setStep("submitted");
      toast({
        title: "Success!",
        description: `${validStudents.length} student claim(s) recorded anonymously.`,
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

  const resetForm = () => {
    setStep("upload");
    setImageFile(null);
    setImagePreview(null);
    setExtractedData(null);
    setInstituteName("");
    setNewspaperName("");
    setStudents([createEmptyStudent()]);
  };

  return (
    <Layout>
      <div className="container py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Newspaper Ad Scanner</h1>
          <p className="text-muted-foreground">
            Upload a coaching advertisement photo. AI will extract all topper claims for verification.
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
                AI is extracting all topper names, ranks, and fine print...
              </p>
            </CardContent>
          </Card>
        )}

        {step === "review" && (
          <div className="space-y-6">
            {/* Image Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Uploaded Advertisement</CardTitle>
              </CardHeader>
              <CardContent>
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Uploaded ad"
                    className="max-h-64 rounded-lg mx-auto"
                  />
                )}
              </CardContent>
            </Card>

            {/* Institute & Newspaper Info */}
            <Card>
              <CardHeader>
                <CardTitle>Advertisement Details</CardTitle>
                <CardDescription>
                  Information about the coaching institute and source
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                      value={instituteName}
                      onChange={(e) => setInstituteName(e.target.value)}
                      placeholder="e.g., ABC Coaching"
                    />
                  </div>
                  <div>
                    <Label htmlFor="newspaper">Newspaper Name</Label>
                    <Input
                      id="newspaper"
                      value={newspaperName}
                      onChange={(e) => setNewspaperName(e.target.value)}
                      placeholder="e.g., Times of India"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Students */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Students ({students.length})
                    </CardTitle>
                    <CardDescription>
                      All toppers mentioned in the advertisement
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={addStudent}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Student
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {students.map((student, index) => (
                  <div
                    key={student.id}
                    className="p-4 rounded-lg border border-border bg-card/50 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Student #{index + 1}</h4>
                      {students.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeStudent(student.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Topper Name *</Label>
                        <Input
                          value={student.topper_name}
                          onChange={(e) => updateStudent(student.id, "topper_name", e.target.value)}
                          placeholder="e.g., Rahul Sharma"
                        />
                      </div>
                      <div>
                        <Label>Rank Claimed *</Label>
                        <Input
                          value={student.rank_claimed}
                          onChange={(e) => updateStudent(student.id, "rank_claimed", e.target.value)}
                          placeholder="e.g., AIR 5, 100%ile"
                        />
                      </div>
                      <div>
                        <Label>Exam Name</Label>
                        <Input
                          value={student.exam_name}
                          onChange={(e) => updateStudent(student.id, "exam_name", e.target.value)}
                          placeholder="e.g., JEE Advanced"
                        />
                      </div>
                      <div>
                        <Label>Exam Year</Label>
                        <Input
                          type="number"
                          value={student.exam_year}
                          onChange={(e) => updateStudent(student.id, "exam_year", parseInt(e.target.value))}
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Fine Print / Disclaimers</Label>
                      <Textarea
                        value={student.fine_print}
                        onChange={(e) => updateStudent(student.id, "fine_print", e.target.value)}
                        placeholder="e.g., Mock Interview, Distance Learning, Crash Course..."
                        rows={2}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep("upload")}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isProcessing}
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
                    Submit {students.filter(s => s.topper_name && s.rank_claimed).length} Claim(s)
                  </>
                )}
              </Button>
            </div>
          </div>
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
                <Button onClick={resetForm}>
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
