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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout/Layout";
import { StatCard } from "@/components/ui/stat-card";
import { useInstitutes } from "@/hooks/useInstitutes";
import { useConflicts } from "@/hooks/useConflicts";
import { useClaims } from "@/hooks/useClaims";

export default function Index() {
  const { data: institutes } = useInstitutes();
  const { data: conflicts } = useConflicts();
  const { data: claims } = useClaims();

  const totalInstitutes = institutes?.length || 0;
  const totalConflicts = conflicts?.length || 0;
  const totalClaims = claims?.length || 0;
  const highRiskCount = institutes?.filter((i) => i.deception_score > 50).length || 0;

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
