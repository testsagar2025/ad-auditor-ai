import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  AlertTriangle,
  CheckCircle,
  FileText,
  Calendar,
  MapPin,
  ExternalLink,
  Award,
  FileDown,
  Users,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DeceptionScore } from "@/components/ui/deception-score";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useInstitute, useInstituteClaims } from "@/hooks/useInstitute";
import { cn } from "@/lib/utils";
import { maskPersonName } from "@/lib/privacy";
import { openPrintWindow, escapeHtml } from "@/lib/print";
import { StudentsTable } from "@/components/institute/StudentsTable";

export default function InstituteDetail() {
  const { id } = useParams();
  const { data: institute, isLoading: instituteLoading } = useInstitute(id);
  const { data: claims, isLoading: claimsLoading } = useInstituteClaims(id);

  if (instituteLoading) {
    return (
      <Layout>
        <div className="container py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-muted rounded w-48" />
            <div className="flex gap-6">
              <div className="h-24 w-24 bg-muted rounded-xl" />
              <div className="space-y-3 flex-1">
                <div className="h-8 bg-muted rounded w-1/2" />
                <div className="h-4 bg-muted rounded w-1/4" />
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!institute) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Institute Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The institute you're looking for doesn't exist or has been removed.
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

  const conflictedClaims = claims?.filter((c) => c.has_conflict) || [];
  const verifiedClaims = claims?.filter((c) => c.is_verified) || [];
  const claimsWithFinePrint = claims?.filter((c) => c.fine_print) || [];

  // Get unique students count
  const uniqueStudents = new Set(claims?.map((c) => c.topper_name.toLowerCase().trim())).size;

  const exportInstitutePdf = () => {
    const safeName = institute.name;
    const rows = (claims || [])
      .map((c) => {
        const statusBadges = [
          c.has_conflict ? '<span class="badge badge-danger">Conflict</span>' : "",
          c.is_verified ? '<span class="badge badge-ok">Verified</span>' : "",
        ]
          .filter(Boolean)
          .join(" ");

        return `
          <div class="card">
            <div class="row" style="justify-content: space-between; align-items: flex-start;">
              <div>
                <h3>${escapeHtml(maskPersonName(c.topper_name))}</h3>
                <p class="muted"><strong>${escapeHtml(c.rank_claimed)}</strong>${c.exam_name ? ` • ${escapeHtml(c.exam_name)}` : ""}${c.exam_year ? ` • ${c.exam_year}` : ""}</p>
              </div>
              <div>${statusBadges}</div>
            </div>
            <div class="row" style="margin-top: 10px;">
              <img class="thumb" src="${escapeHtml(c.newspaper_image_url)}" alt="Evidence" />
              <div style="flex:1;">
                ${c.newspaper_name ? `<p class="muted">Source: ${escapeHtml(c.newspaper_name)}</p>` : ""}
                ${c.fine_print ? `<p><strong>Fine print:</strong> ${escapeHtml(c.fine_print)}</p>` : ""}
              </div>
            </div>
          </div>
        `;
      })
      .join("\n");

    const html = `
      <div class="section">
        <h2 class="section-title">Claims Overview</h2>
        ${rows || '<p class="muted">No claims found.</p>'}
      </div>
    `;

    openPrintWindow({ 
      title: `${safeName} Dossier`, 
      html,
      showWatermark: true,
      coverPage: {
        title: `${safeName}`,
        subtitle: "Institute Dossier",
        logo: institute.logo_url || undefined,
        generatedAt: new Date().toLocaleString(),
        stats: [
          { label: "Total Claims", value: institute.total_claims },
          { label: "Conflicts", value: institute.conflicted_claims },
          { label: "Deception Score", value: `${institute.deception_score}/100` },
        ],
      },
    });
  };

  return (
    <Layout>
      <div className="container py-8">
        {/* Breadcrumb */}
        <Button variant="ghost" size="sm" className="mb-6" asChild>
          <Link to="/store">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Store
          </Link>
        </Button>

        {/* Header */}
        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          <div className="flex items-start gap-6 flex-1">
            <div className="h-24 w-24 rounded-xl bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
              {institute.logo_url ? (
                <img
                  src={institute.logo_url}
                  alt={institute.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Building2 className="h-12 w-12 text-muted-foreground" />
              )}
            </div>

            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{institute.name}</h1>
              {institute.location && (
                <p className="text-muted-foreground flex items-center gap-1 mb-3">
                  <MapPin className="h-4 w-4" />
                  {institute.location}
                </p>
              )}
              {institute.description && (
                <p className="text-sm text-muted-foreground">
                  {institute.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center lg:items-end gap-4">
            <DeceptionScore score={institute.deception_score} size="lg" />
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" asChild>
                <Link to={`/report/institute/${institute.id}`}>
                  <FileDown className="h-4 w-4 mr-2" />
                  Generate CCPA Report
                </Link>
              </Button>
              <Button variant="outline" onClick={exportInstitutePdf}>
                <FileDown className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{institute.total_claims}</div>
              <p className="text-sm text-muted-foreground">Total Claims</p>
            </CardContent>
          </Card>
          <Card className={institute.conflicted_claims > 0 ? "border-destructive/50" : ""}>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-destructive">
                {institute.conflicted_claims}
              </div>
              <p className="text-sm text-muted-foreground">Conflicts</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-success">
                {institute.verified_claims}
              </div>
              <p className="text-sm text-muted-foreground">Verified</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-warning">
                {claimsWithFinePrint.length}
              </div>
              <p className="text-sm text-muted-foreground">With Fine Print</p>
            </CardContent>
          </Card>
        </div>

        {/* Claims Tabs */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="all">
              All Claims ({claims?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="students" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              Students ({uniqueStudents})
            </TabsTrigger>
            <TabsTrigger value="conflicts">
              Conflicts ({conflictedClaims.length})
            </TabsTrigger>
            <TabsTrigger value="verified">
              Verified ({verifiedClaims.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {claimsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="audit-card animate-pulse">
                    <div className="h-24 bg-muted rounded" />
                  </div>
                ))}
              </div>
            ) : claims?.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No claims yet</h3>
                <p className="text-muted-foreground mb-4">
                  Be the first to submit a claim for this institute
                </p>
                <Button asChild>
                  <Link to="/scanner">Upload an Ad</Link>
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {claims?.map((claim) => (
                  <ClaimCard
                    key={claim.id}
                    claim={claim}
                    instituteLogoUrl={institute.logo_url}
                    instituteName={institute.name}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="students" className="space-y-4">
            <StudentsTable claims={claims || []} />
          </TabsContent>

          <TabsContent value="conflicts" className="space-y-4">
            {conflictedClaims.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No conflicts detected</h3>
                <p className="text-muted-foreground">
                  All claims from this institute appear to be unique
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {conflictedClaims.map((claim) => (
                  <ClaimCard
                    key={claim.id}
                    claim={claim}
                    instituteLogoUrl={institute.logo_url}
                    instituteName={institute.name}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="verified" className="space-y-4">
            {verifiedClaims.length === 0 ? (
              <div className="text-center py-12">
                <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No verified claims</h3>
                <p className="text-muted-foreground">
                  Claims are verified after thorough review
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {verifiedClaims.map((claim) => (
                  <ClaimCard
                    key={claim.id}
                    claim={claim}
                    instituteLogoUrl={institute.logo_url}
                    instituteName={institute.name}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

interface ClaimCardProps {
  claim: import("@/types/database").TopperClaim;
  instituteLogoUrl?: string | null;
  instituteName?: string;
}

function ClaimCard({ claim, instituteLogoUrl, instituteName }: ClaimCardProps) {
  return (
    <div
      className={cn(
        "audit-card",
        claim.has_conflict && "border-destructive/30 glow-destructive"
      )}
    >
      <div className="flex flex-col md:flex-row gap-4">
        {/* Newspaper Image */}
        <div className="w-full md:w-48 h-32 rounded-lg overflow-hidden bg-muted flex-shrink-0">
          <img
            src={claim.newspaper_image_url}
            alt="Newspaper ad"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Claim Details */}
        <div className="flex-1 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2">
                {instituteLogoUrl ? (
                  <img
                    src={instituteLogoUrl}
                    alt={instituteName || "Institute"}
                    className="h-6 w-6 rounded-md object-cover border border-border"
                    loading="lazy"
                  />
                ) : (
                  <Award className="h-4 w-4 text-primary" />
                )}
                {maskPersonName(claim.topper_name)}
              </h3>
              <p className="text-primary font-medium">{claim.rank_claimed}</p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {claim.has_conflict && (
                <Badge variant="destructive">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Conflict
                </Badge>
              )}
              {claim.is_verified && (
                <Badge variant="outline" className="text-success border-success/30">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {claim.exam_name && (
              <span className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                {claim.exam_name}
              </span>
            )}
            {claim.exam_year && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {claim.exam_year}
              </span>
            )}
            {claim.newspaper_name && (
              <span className="flex items-center gap-1">
                <ExternalLink className="h-3 w-3" />
                {claim.newspaper_name}
              </span>
            )}
          </div>

          {claim.fine_print && (
            <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
              <p className="text-xs text-warning font-medium mb-1">⚠️ Fine Print Detected:</p>
              <p className="text-sm text-muted-foreground">{claim.fine_print}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
