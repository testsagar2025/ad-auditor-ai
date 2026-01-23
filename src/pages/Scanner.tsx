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
  Users,
  Lock,
  GraduationCap
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { trackSubmission } from "@/hooks/useAnalytics";
import type { ExtractedAdData, ExtractedStudent } from "@/types/database";

type ScanStep = "upload" | "processing" | "review" | "submitted";

interface StudentFormData {
  id: string;
  topper_name: string;
  rank_claimed: string;
  exam_name: string;
  exam_year: number;
  fine_print: string;
  course_category: string;
}

const createEmptyStudent = (): StudentFormData => ({
  id: crypto.randomUUID(),
  topper_name: "",
  rank_claimed: "",
  exam_name: "",
  exam_year: new Date().getFullYear(),
  fine_print: "",
  course_category: "JEE",
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
  const [location, setLocation] = useState("");
  const [courseCategory, setCourseCategory] = useState("JEE");
  const [students, setStudents] = useState<StudentFormData[]>([createEmptyStudent()]);
  const [isExtracted, setIsExtracted] = useState(false);

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
        const extracted = data.extracted as ExtractedAdData & { course_category?: string };
        setExtractedData(extracted);
        setInstituteName(extracted.institute_name || "");
        setCourseCategory(extracted.course_category || "JEE");
        setIsExtracted(true);
        
        if (extracted.students && extracted.students.length > 0) {
          setStudents(extracted.students.map((s: ExtractedStudent) => ({
            id: crypto.randomUUID(),
            topper_name: s.topper_name || "",
            rank_claimed: s.rank_claimed || "",
            exam_name: s.exam_name || "",
            exam_year: s.exam_year || new Date().getFullYear(),
            fine_print: s.fine_print || "",
            course_category: extracted.course_category || "JEE",
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
      setIsExtracted(false);
      setStep("review");
    } finally {
      setIsProcessing(false);
    }
  };

  const addStudent = () => {
    if (!isExtracted) {
      setStudents([...students, createEmptyStudent()]);
    }
  };

  const removeStudent = (id: string) => {
    if (students.length > 1 && !isExtracted) {
      setStudents(students.filter(s => s.id !== id));
    }
  };

  const updateStudent = (id: string, field: keyof StudentFormData, value: string | number) => {
    // Only allow editing if not extracted (for non-student fields handled separately)
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

      // Use AI to normalize institute name
      const { data: normalizeResult } = await supabase.functions.invoke("normalize-institute", {
        body: { institute_name: instituteName },
      });

      let instituteId: string | null = null;

      if (normalizeResult?.matched && normalizeResult.matched_id) {
        // Use existing institute
        instituteId = normalizeResult.matched_id;
        
        // Update total claims count
        const { data: existing } = await supabase
          .from("coaching_institutes")
          .select("total_claims")
          .eq("id", instituteId)
          .single();

        await supabase
          .from("coaching_institutes")
          .update({ 
            total_claims: (existing?.total_claims || 0) + validStudents.length,
            course_category: courseCategory,
          })
          .eq("id", instituteId);

        toast({
          title: "Institute matched",
          description: `Matched to existing: ${normalizeResult.matched_name}`,
        });
      } else {
        // Create new institute with normalized name
        const normalizedName = normalizeResult?.normalized_name || instituteName;
        
        const { data: newInstitute, error: instituteError } = await supabase
          .from("coaching_institutes")
          .insert({ 
            name: normalizedName, 
            total_claims: validStudents.length,
            location: location || null,
            course_category: courseCategory,
          })
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
          course_category: courseCategory,
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

      // Track submission
      await trackSubmission({ 
        institute_name: instituteName,
        students_count: validStudents.length,
        course_category: courseCategory,
      });

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
    setLocation("");
    setCourseCategory("JEE");
    setStudents([createEmptyStudent()]);
    setIsExtracted(false);
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
                  {isExtracted 
                    ? "AI extracted data. You can edit location and newspaper name only."
                    : "Enter the details manually"}
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
                    <Label htmlFor="institute" className="flex items-center gap-2">
                      Institute Name *
                      {isExtracted && <Lock className="h-3 w-3 text-muted-foreground" />}
                    </Label>
                    <Input
                      id="institute"
                      value={instituteName}
                      onChange={(e) => !isExtracted && setInstituteName(e.target.value)}
                      placeholder="e.g., ABC Coaching"
                      disabled={isExtracted}
                      className={isExtracted ? "bg-muted" : ""}
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
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g., Kota, Rajasthan"
                    />
                  </div>
                  <div>
                    <Label className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" />
                      Course Category
                    </Label>
                    <div className="flex gap-2 mt-1">
                      {["JEE", "NEET"].map((cat) => (
                        <Button
                          key={cat}
                          type="button"
                          variant={courseCategory === cat ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCourseCategory(cat)}
                          disabled={isExtracted}
                        >
                          {cat}
                        </Button>
                      ))}
                    </div>
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
                      {isExtracted && (
                        <Badge variant="secondary" className="ml-2">
                          <Lock className="h-3 w-3 mr-1" />
                          AI Extracted
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {isExtracted 
                        ? "Student details are locked. Only admin can edit."
                        : "All toppers mentioned in the advertisement"}
                    </CardDescription>
                  </div>
                  {!isExtracted && (
                    <Button variant="outline" size="sm" onClick={addStudent}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Student
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {students.map((student, index) => (
                  <div
                    key={student.id}
                    className={`p-4 rounded-lg border space-y-4 ${
                      isExtracted 
                        ? "border-primary/20 bg-primary/5" 
                        : "border-border bg-card/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium flex items-center gap-2">
                        Student #{index + 1}
                        {student.fine_print && (
                          <Badge variant="outline" className="text-warning border-warning/30">
                            ⚠️ Fine Print
                          </Badge>
                        )}
                      </h4>
                      {students.length > 1 && !isExtracted && (
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
                        <Label className="flex items-center gap-2">
                          Topper Name *
                          {isExtracted && <Lock className="h-3 w-3 text-muted-foreground" />}
                        </Label>
                        <Input
                          value={student.topper_name}
                          onChange={(e) => !isExtracted && updateStudent(student.id, "topper_name", e.target.value)}
                          placeholder="e.g., Rahul Sharma"
                          disabled={isExtracted}
                          className={isExtracted ? "bg-muted" : ""}
                        />
                      </div>
                      <div>
                        <Label className="flex items-center gap-2">
                          Rank Claimed *
                          {isExtracted && <Lock className="h-3 w-3 text-muted-foreground" />}
                        </Label>
                        <Input
                          value={student.rank_claimed}
                          onChange={(e) => !isExtracted && updateStudent(student.id, "rank_claimed", e.target.value)}
                          placeholder="e.g., AIR 5, 100%ile"
                          disabled={isExtracted}
                          className={isExtracted ? "bg-muted" : ""}
                        />
                      </div>
                      <div>
                        <Label className="flex items-center gap-2">
                          Exam Name
                          {isExtracted && <Lock className="h-3 w-3 text-muted-foreground" />}
                        </Label>
                        <Input
                          value={student.exam_name}
                          onChange={(e) => !isExtracted && updateStudent(student.id, "exam_name", e.target.value)}
                          placeholder="e.g., JEE Advanced"
                          disabled={isExtracted}
                          className={isExtracted ? "bg-muted" : ""}
                        />
                      </div>
                      <div>
                        <Label className="flex items-center gap-2">
                          Exam Year
                          {isExtracted && <Lock className="h-3 w-3 text-muted-foreground" />}
                        </Label>
                        <Input
                          type="number"
                          value={student.exam_year}
                          onChange={(e) => !isExtracted && updateStudent(student.id, "exam_year", parseInt(e.target.value))}
                          placeholder="2024"
                          disabled={isExtracted}
                          className={isExtracted ? "bg-muted" : ""}
                        />
                      </div>
                    </div>

                    {/* Fine Print Display */}
                    {student.fine_print && (
                      <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                        <p className="text-xs text-warning font-medium mb-1">⚠️ Fine Print Detected:</p>
                        <p className="text-sm text-muted-foreground">{student.fine_print}</p>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setStep("upload")}>
                Back
              </Button>
              <Button className="flex-1" onClick={handleSubmit} disabled={isProcessing}>
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
          <Card className="border-success/30">
            <CardContent className="py-16 text-center">
              <CheckCircle className="h-16 w-16 mx-auto text-success mb-4" />
              <h3 className="text-2xl font-bold mb-2">Submission Successful!</h3>
              <p className="text-muted-foreground mb-6">
                Your claim(s) have been recorded. Our system will check for conflicts.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="outline" onClick={() => navigate("/store")}>
                  View Institutes
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
          All submissions are anonymous. We do not track or store any personal information.
        </p>
      </div>
    </Layout>
  );
}
