import { Link } from "react-router-dom";
import {
  Shield,
  Upload,
  AlertTriangle,
  FileText,
  Search,
  Eye,
  Scale,
  TrendingUp,
  Award,
  ArrowRight,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout/Layout";
import { StatCard } from "@/components/ui/stat-card";
import { DeceptionScore } from "@/components/ui/deception-score";
import { Badge } from "@/components/ui/badge";
import { useInstitutes } from "@/hooks/useInstitutes";
import { useConflicts } from "@/hooks/useConflicts";
import { useClaims } from "@/hooks/useClaims";
import { cn } from "@/lib/utils";
import { maskPersonName } from "@/lib/privacy";

export default function Index() {
  const { data: institutes } = useInstitutes();
  const { data: conflicts } = useConflicts();
  const { data: claims } = useClaims();

  const totalInstitutes = institutes?.length || 0;
  const totalConflicts = conflicts?.length || 0;
  const totalClaims = claims?.length || 0;
  const highRiskCount = institutes?.filter((i) => i.deception_score > 50).length || 0;

  // Get top offenders (highest deception scores)
  const topOffenders = institutes?.slice().sort((a, b) => b.deception_score - a.deception_score).slice(0, 5) || [];

  // Get recent claims
  const recentClaims = claims?.slice(0, 6) || [];

  // Get active conflicts
  const activeConflicts = conflicts?.filter((c) => c.status !== "dismissed").slice(0, 3) || [];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-destructive/5 to-transparent" />
        <div className="container relative">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/10 text-destructive text-sm font-medium">
              <Shield className="h-4 w-4" />
              Public Interest Transparency Platform
            </div>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Un<span className="text-destructive">Mask</span> the Truth
              <br />
              Behind Coaching Ads
            </h1>

            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Audit coaching institute advertisements. Detect conflicting topper claims.
              Generate CCPA complaints. All 100% anonymous.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button size="lg" asChild>
                <Link to="/scanner">
                  <Upload className="h-5 w-5 mr-2" />
                  Upload Newspaper Ad
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/store">
                  <Search className="h-5 w-5 mr-2" />
                  Browse The Store
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-t border-border">
        <div className="container">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              icon={<Eye className="h-5 w-5" />}
              label="Institutes Tracked"
              value={totalInstitutes}
              variant="default"
            />
            <StatCard
              icon={<FileText className="h-5 w-5" />}
              label="Claims Analyzed"
              value={totalClaims}
              variant="default"
            />
            <StatCard
              icon={<AlertTriangle className="h-5 w-5" />}
              label="Conflicts Detected"
              value={totalConflicts}
              variant="destructive"
            />
            <StatCard
              icon={<TrendingUp className="h-5 w-5" />}
              label="High Risk Institutes"
              value={highRiskCount}
              variant="warning"
            />
          </div>
        </div>
      </section>

      {/* Top Offenders Section */}
      {topOffenders.length > 0 && (
        <section className="py-16 bg-card/50 border-y border-border">
          <div className="container">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold mb-2">Top Offenders</h2>
                <p className="text-muted-foreground">Institutes with highest deception scores</p>
              </div>
              <Button variant="outline" asChild>
                <Link to="/store">
                  View All
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topOffenders.map((institute, index) => (
                <Link
                  key={institute.id}
                  to={`/store/${institute.id}`}
                  className={cn(
                    "audit-card group cursor-pointer flex items-center gap-4",
                    index === 0 && "lg:col-span-1 border-destructive/50"
                  )}
                >
                  <div className="text-2xl font-bold text-muted-foreground w-8">
                    #{index + 1}
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                    {institute.logo_url ? (
                      <img
                        src={institute.logo_url}
                        alt={institute.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Building2 className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                      {institute.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {institute.conflicted_claims} conflicts
                    </p>
                  </div>
                  <DeceptionScore score={institute.deception_score} size="sm" showLabel={false} />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Recent Claims Section */}
      {recentClaims.length > 0 && (
        <section className="py-16 border-b border-border">
          <div className="container">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold mb-2">Recent Submissions</h2>
                <p className="text-muted-foreground">Latest topper claims under analysis</p>
              </div>
              <Button variant="outline" asChild>
                <Link to="/scanner">
                  Submit Your Own
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentClaims.map((claim) => (
                <div
                  key={claim.id}
                  className={cn(
                    "audit-card",
                    claim.has_conflict && "border-destructive/30"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Award className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-semibold truncate">{maskPersonName(claim.topper_name)}</h4>
                          <p className="text-sm text-primary">{claim.rank_claimed}</p>
                        </div>
                        {claim.has_conflict && (
                          <Badge variant="destructive" className="text-xs flex-shrink-0">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Conflict
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {claim.exam_name} {claim.exam_year}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Active Conflicts */}
      {activeConflicts.length > 0 && (
        <section className="py-16">
          <div className="container">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold mb-2">Active Conflicts</h2>
                <p className="text-muted-foreground">Cases where multiple institutes claim the same topper</p>
              </div>
              <Button variant="outline" asChild>
                <Link to="/conflicts">
                  View All Conflicts
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>

            <div className="space-y-4">
              {activeConflicts.map((conflict) => (
                <div
                  key={conflict.id}
                  className={cn(
                    "audit-card",
                    conflict.severity === "critical" && "border-destructive/50 glow-destructive"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="h-6 w-6 text-destructive" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold">{conflict.topper_name} - {conflict.rank_claimed}</h4>
                      <p className="text-sm text-muted-foreground">
                        {conflict.exam_name} {conflict.exam_year} • {conflict.institute_ids?.length || 0} institutes claiming
                      </p>
                    </div>
                    <Badge
                      className={cn(
                        conflict.severity === "critical" && "bg-destructive",
                        conflict.severity === "high" && "bg-destructive/80",
                        conflict.severity === "medium" && "bg-warning",
                        conflict.severity === "low" && "bg-muted"
                      )}
                    >
                      {conflict.severity}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How It Works */}
      <section className="py-16 bg-card border-y border-border">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A simple 4-step process to expose misleading coaching advertisements
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center space-y-4">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">1. Upload</h3>
              <p className="text-sm text-muted-foreground">
                Photograph a newspaper coaching advertisement and upload it anonymously
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <Eye className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">2. Extract</h3>
              <p className="text-sm text-muted-foreground">
                AI scans the ad to extract topper names, ranks, and hidden fine print
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="h-16 w-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <h3 className="font-semibold text-lg">3. Detect</h3>
              <p className="text-sm text-muted-foreground">
                Conflicts are automatically flagged when toppers are claimed by multiple institutes
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="h-16 w-16 rounded-2xl bg-success/10 flex items-center justify-center mx-auto">
                <Scale className="h-8 w-8 text-success" />
              </div>
              <h3 className="font-semibold text-lg">4. Report</h3>
              <p className="text-sm text-muted-foreground">
                Generate professional CCPA complaint documents with all evidence compiled
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <h2 className="text-3xl font-bold">Ready to Expose the Truth?</h2>
            <p className="text-muted-foreground">
              Join the movement for transparency in education advertising. Your identity stays completely anonymous.
            </p>
            <Button size="lg" className="bg-destructive hover:bg-destructive/90" asChild>
              <Link to="/scanner">
                <Upload className="h-5 w-5 mr-2" />
                Start Uploading Evidence
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
