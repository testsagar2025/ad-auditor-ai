import { Shield, Eye, Scale, Lock, Users, AlertTriangle } from "lucide-react";
import { Layout } from "@/components/layout/Layout";

export default function About() {
  return (
    <Layout>
      <div className="container py-16 max-w-4xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/10 text-destructive text-sm font-medium mb-4">
            <Shield className="h-4 w-4" />
            Public Interest Platform
          </div>
          <h1 className="text-4xl font-bold mb-4">Our Mission</h1>
          <p className="text-lg text-muted-foreground">
            Bringing transparency to coaching institute advertising through community-powered auditing
          </p>
        </div>

        <div className="prose prose-invert max-w-none">
          <div className="audit-card mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              The Problem
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Every year, coaching institutes spend millions on newspaper advertisements claiming 
              their students topped competitive exams. The same topper often appears in multiple 
              institute ads, sometimes with disclaimers hidden in fine print like "Mock Interview 
              Batch" or "Crash Course Student." This misleads aspiring students and their families 
              who invest significant resources based on false advertising.
            </p>
          </div>

          <div className="audit-card mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Eye className="h-6 w-6 text-primary" />
              Our Solution
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              UnMask is a public-interest transparency platform that allows anyone to anonymously 
              upload coaching institute advertisements. Our AI-powered scanner extracts topper 
              claims, ranks, and hidden fine print. When the same topper is claimed by multiple 
              institutes, we automatically flag the conflict. This creates a searchable database 
              that holds institutes accountable.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="audit-card text-center">
              <Lock className="h-8 w-8 text-success mx-auto mb-4" />
              <h3 className="font-semibold mb-2">100% Anonymous</h3>
              <p className="text-sm text-muted-foreground">
                We never track users or store identifying information
              </p>
            </div>
            <div className="audit-card text-center">
              <Users className="h-8 w-8 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Community Powered</h3>
              <p className="text-sm text-muted-foreground">
                Built by the community, for the community
              </p>
            </div>
            <div className="audit-card text-center">
              <Scale className="h-8 w-8 text-warning mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Legal Framework</h3>
              <p className="text-sm text-muted-foreground">
                Generate CCPA-ready complaint documents
              </p>
            </div>
          </div>

          <div className="audit-card">
            <h2 className="text-2xl font-bold mb-4">Legal Basis</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              UnMask operates as a consumer awareness and social audit platform. We use publicly 
              available newspaper advertisements as our data source. Users submit information 
              voluntarily and anonymously. All data is used for public interest purposes of 
              consumer protection and transparency in education advertising.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              The platform enables citizens to exercise their right to information and consumer 
              protection under the Consumer Protection Act, 2019 (India) and equivalent 
              legislation in other jurisdictions.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
