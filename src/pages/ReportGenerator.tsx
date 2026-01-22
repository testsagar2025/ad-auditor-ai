import { useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  FileDown,
  Loader2,
  Building2,
  AlertTriangle,
  CheckCircle,
  FileText,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useInstitute, useInstituteClaims } from "@/hooks/useInstitute";
import { useConflict } from "@/hooks/useConflicts";
import { supabase } from "@/integrations/supabase/client";
import { maskPersonName } from "@/lib/privacy";
import { openPrintWindow } from "@/lib/print";
import { useQuery } from "@tanstack/react-query";
import type { CoachingInstitute, TopperClaim } from "@/types/database";

export default function ReportGenerator() {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  const isInstituteReport = type === "institute";
  const isConflictReport = type === "conflict";

  const { data: institute, isLoading: instituteLoading } = useInstitute(
    isInstituteReport ? id : undefined
  );
  const { data: claims } = useInstituteClaims(isInstituteReport ? id : undefined);

  const { data: conflict, isLoading: conflictLoading } = useConflict(
    isConflictReport ? id || "" : ""
  );

  const { data: conflictClaims, isLoading: conflictClaimsLoading } = useQuery({
    queryKey: ["report-conflict-claims", conflict?.id],
    enabled: !!conflict?.claim_ids?.length,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("topper_claims")
        .select("*")
        .in("id", conflict!.claim_ids);
      if (error) throw error;
      return (data ?? []) as TopperClaim[];
    },
  });

  const { data: conflictInstitutes, isLoading: conflictInstitutesLoading } = useQuery({
    queryKey: ["report-conflict-institutes", conflict?.id],
    enabled: !!conflict?.institute_ids?.length,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coaching_institutes")
        .select("*")
        .in("id", conflict!.institute_ids);
      if (error) throw error;
      return (data ?? []) as CoachingInstitute[];
    },
  });

  const conflictInstituteNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const inst of conflictInstitutes ?? []) map.set(inst.id, inst.name);
    return map;
  }, [conflictInstitutes]);

  const conflictedClaims = claims?.filter((c) => c.has_conflict) || [];
  const activeClaims = isInstituteReport ? conflictedClaims : conflictClaims || [];

  const generateReport = async () => {
    if (isInstituteReport && !institute) return;
    if (isConflictReport && !conflict) return;

    setIsGenerating(true);

    try {
      const generatedAt = new Date().toISOString();

      const nextReportData = isInstituteReport
        ? {
            institute_name: institute!.name,
            institute_logo: institute!.logo_url,
            generated_at: generatedAt,
            summary: `This report documents ${conflictedClaims.length} potential misleading claims by ${institute!.name}. The institute has a deception score of ${institute!.deception_score}/100.`,
            conflict_details: conflictedClaims.map((claim) => ({
              topper_name: claim.topper_name,
              rank_claimed: claim.rank_claimed,
              exam_name: claim.exam_name || "Unknown",
              exam_year: claim.exam_year || new Date().getFullYear(),
              fine_print: claim.fine_print,
              newspaper_images: [claim.newspaper_image_url],
            })),
            total_claims: institute!.total_claims,
            conflicted_claims: institute!.conflicted_claims,
            deception_score: institute!.deception_score,
          }
        : {
            institute_name: "Multiple institutes",
            institute_logo: null,
            generated_at: generatedAt,
            summary: `This report documents a conflict where multiple coaching institutes claim the same topper.`,
            conflict_details: (conflictClaims ?? []).map((claim) => ({
              topper_name: claim.topper_name,
              rank_claimed: claim.rank_claimed,
              exam_name: claim.exam_name || "Unknown",
              exam_year: claim.exam_year || new Date().getFullYear(),
              fine_print: claim.fine_print,
              conflicting_institutes: claim.institute_id
                ? [conflictInstituteNameMap.get(claim.institute_id) || "Unknown institute"]
                : ["Unknown institute"],
              newspaper_images: [claim.newspaper_image_url],
            })),
          };

      const { error } = await supabase.from("ccpa_reports").insert(
        isInstituteReport
          ? { institute_id: institute!.id, report_data: nextReportData }
          : { conflict_id: conflict!.id, report_data: nextReportData }
      );

      if (error) throw error;

      setReportData(nextReportData);
      setReportGenerated(true);
      toast({
        title: "Report Generated",
        description: "Your CCPA complaint dossier has been created.",
      });
    } catch (error) {
      console.error("Report generation error:", error);
      toast({
        title: "Generation Failed",
        description: "Could not generate the report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const exportPdf = () => {
    if (isInstituteReport && !institute) return;
    if (isConflictReport && !conflict) return;

    if (isConflictReport) {
      const items = (conflictClaims ?? [])
        .map((c) => {
          const instName = c.institute_id
            ? conflictInstituteNameMap.get(c.institute_id) || "Unknown institute"
            : "Unknown institute";
          const title = `${escapeHtml(maskPersonName(c.topper_name))} — ${escapeHtml(c.rank_claimed)}`;
          const meta = `${escapeHtml(instName)}${c.exam_name ? ` • ${escapeHtml(c.exam_name)}` : ""}$${
            c.exam_year ? ` • ${c.exam_year}` : ""
          }`;
          const fine = c.fine_print
            ? `<p><strong>Fine print:</strong> ${escapeHtml(c.fine_print)}</p>`
            : "";
          const img = `<img class="thumb" src="${escapeHtml(c.newspaper_image_url)}" alt="Evidence" />`;
          return `
            <div class="card">
              <h3>${title}</h3>
              <p class="muted">${escapeHtml(meta.replace("$", ""))}</p>
              <div class="row" style="margin-top: 10px; align-items: flex-start;">
                ${img}
                <div style="flex:1;">
                  ${c.newspaper_name ? `<p class="muted">Source: ${escapeHtml(c.newspaper_name)}</p>` : ""}
                  ${fine}
                </div>
              </div>
            </div>
          `;
        })
        .join("\n");

      const html = `
        <h1>${escapeHtml(maskPersonName(conflict!.topper_name))} — ${escapeHtml(conflict!.rank_claimed)}</h1>
        <p class="muted">Generated: ${new Date().toLocaleString()}</p>
        <p class="muted">Severity: <strong>${escapeHtml(conflict!.severity)}</strong> • Status: <strong>${escapeHtml(
        conflict!.status
      )}</strong></p>
        <div class="card">
          <h2>Summary</h2>
          <p>${escapeHtml(reportData?.summary || "")}</p>
        </div>
        <h2>Evidence</h2>
        ${items || '<p class="muted">No evidence found for this conflict.</p>'}
      `;

      openPrintWindow({ title: `Conflict Dossier`, html });
      return;
    }

    const logo = institute.logo_url
      ? `<img class="logo" src="${escapeHtml(institute.logo_url)}" alt="${escapeHtml(institute.name)}" />`
      : "";

    const items = conflictedClaims
      .map((c) => {
        const title = `${escapeHtml(maskPersonName(c.topper_name))} — ${escapeHtml(c.rank_claimed)}`;
        const meta = `${c.exam_name ? escapeHtml(c.exam_name) : ""}${c.exam_year ? ` • ${c.exam_year}` : ""}`;
        const fine = c.fine_print ? `<p><strong>Fine print:</strong> ${escapeHtml(c.fine_print)}</p>` : "";
        const img = `<img class="thumb" src="${escapeHtml(c.newspaper_image_url)}" alt="Evidence" />`;
        return `
          <div class="card">
            <h3>${title}</h3>
            <p class="muted">${meta}</p>
            <div class="row" style="margin-top: 10px; align-items: flex-start;">
              ${img}
              <div style="flex:1;">
                ${c.newspaper_name ? `<p class="muted">Source: ${escapeHtml(c.newspaper_name)}</p>` : ""}
                ${fine}
              </div>
            </div>
          </div>
        `;
      })
      .join("\n");

    const html = `
      <div class="row" style="justify-content: space-between;">
        <div class="row">
          ${logo}
          <div>
            <h1>CCPA Complaint Dossier</h1>
            <p class="muted">Institute: <strong>${escapeHtml(institute.name)}</strong></p>
            <p class="muted">Generated: ${new Date().toLocaleString()}</p>
          </div>
        </div>
        <div class="card" style="margin:0;">
          <div class="grid grid-3">
            <div><p class="muted">Total Claims</p><h2>${institute.total_claims}</h2></div>
            <div><p class="muted">Conflicts</p><h2>${conflictedClaims.length}</h2></div>
            <div><p class="muted">Score</p><h2>${institute.deception_score}/100</h2></div>
          </div>
        </div>
      </div>
      <div style="height: 10px;"></div>
      <div class="card">
        <h2>Summary</h2>
        <p>${escapeHtml(reportData?.summary || "")}</p>
      </div>
      <h2>Evidence & Conflicts</h2>
      ${items || '<p class="muted">No conflicts detected for this institute.</p>'}
    `;

    openPrintWindow({ title: `${institute.name} CCPA Dossier`, html });
  };

  function escapeHtml(input: string) {
    return input
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  if (isInstituteReport && instituteLoading) {
    return (
      <Layout>
        <div className="container py-8 max-w-3xl">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-muted rounded w-48" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </div>
      </Layout>
    );
  }

  if (isConflictReport && (conflictLoading || conflictClaimsLoading || conflictInstitutesLoading)) {
    return (
      <Layout>
        <div className="container py-8 max-w-3xl">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-muted rounded w-48" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </div>
      </Layout>
    );
  }

  if (isInstituteReport && !institute) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Institute Not Found</h2>
          <p className="text-muted-foreground mb-6">
            Cannot generate report for this institute.
          </p>
          <Button asChild>
            <Link to="/store">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Store
            </Link>
          </Button>
        </div>
      </Layout>
    );
  }

  if (isConflictReport && !conflict) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <AlertTriangle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Conflict Not Found</h2>
          <p className="text-muted-foreground mb-6">Cannot generate report for this conflict.</p>
          <Button asChild>
            <Link to="/conflicts">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Conflicts
            </Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8 max-w-3xl">
        <Button variant="ghost" size="sm" className="mb-6" asChild>
          <Link to={`/store/${institute.id}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Institute
          </Link>
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Generate CCPA Report</h1>
          <p className="text-muted-foreground">
            Create a formal complaint dossier for {institute.name}
          </p>
        </div>

        {reportGenerated ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Report Generated!</h3>
              <p className="text-muted-foreground mb-6">
                Your CCPA complaint dossier has been created and saved.
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => navigate(`/store/${institute.id}`)}>
                  View Institute
                </Button>
                <Button variant="outline" onClick={exportPdf}>
                  <FileDown className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
                <Button onClick={() => navigate("/conflicts")}>
                  View All Conflicts
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Report Summary
              </CardTitle>
              <CardDescription>
                This report will include all documented conflicts and evidence
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Institute Summary */}
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                  {institute.logo_url ? (
                    <img
                      src={institute.logo_url}
                      alt={institute.name}
                      className="h-full w-full object-cover rounded-lg"
                    />
                  ) : (
                    <Building2 className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <h4 className="font-semibold">{institute.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    Deception Score: {institute.deception_score}/100
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-card border">
                  <div className="text-2xl font-bold">{institute.total_claims}</div>
                  <p className="text-xs text-muted-foreground">Total Claims</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                  <div className="text-2xl font-bold text-destructive">
                    {conflictedClaims.length}
                  </div>
                  <p className="text-xs text-muted-foreground">Conflicts</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-card border">
                  <div className="text-2xl font-bold">{claims?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">Evidence Items</p>
                </div>
              </div>

              {/* Conflicts Preview */}
              {conflictedClaims.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    Conflicts to be included:
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {conflictedClaims.map((claim) => (
                      <div
                        key={claim.id}
                        className="p-3 rounded-lg bg-destructive/5 border border-destructive/10"
                      >
                        <p className="font-medium text-sm">
                          {maskPersonName(claim.topper_name)} - {claim.rank_claimed}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {claim.exam_name} {claim.exam_year}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {conflictedClaims.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No conflicts detected for this institute</p>
                  <p className="text-xs mt-1">
                    A report can still be generated with available claims data
                  </p>
                </div>
              )}

              <Button
                className="w-full"
                size="lg"
                onClick={generateReport}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating Report...
                  </>
                ) : (
                  <>
                    <FileDown className="h-4 w-4 mr-2" />
                    Generate CCPA Dossier
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        <p className="text-xs text-muted-foreground text-center mt-8">
          Reports are generated anonymously and can be used to file complaints with the CCPA
        </p>
      </div>
    </Layout>
  );
}
