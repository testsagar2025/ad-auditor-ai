import { Lock, Shield, Eye, Database } from "lucide-react";
import { Layout } from "@/components/layout/Layout";

export default function Privacy() {
  return (
    <Layout>
      <div className="container py-16 max-w-3xl">
        <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
        
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 text-success text-sm font-medium mb-8">
          <Lock className="h-4 w-4" />
          100% Anonymous Platform
        </div>

        <div className="prose prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <section className="audit-card">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-success" />
              Core Privacy Commitment
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              UnMask is designed from the ground up for anonymity. We do not track users, 
              require accounts, store IP addresses, or collect any personally identifiable 
              information. Your privacy is not just a feature—it's the foundation of our platform.
            </p>
          </section>

          <section className="audit-card">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              What We Store
            </h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Uploaded newspaper advertisement images</li>
              <li>Extracted data: topper names, ranks, institute names</li>
              <li>Fine print and disclaimer text from advertisements</li>
              <li>Conflict detection results</li>
              <li>Generated report documents</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              None of this data is linked to any user identity.
            </p>
          </section>

          <section className="audit-card">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Eye className="h-5 w-5 text-warning" />
              What We Don't Collect
            </h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>User accounts or login information</li>
              <li>Email addresses or phone numbers</li>
              <li>IP addresses or device fingerprints</li>
              <li>Location data</li>
              <li>Cookies for tracking purposes</li>
              <li>Any personally identifiable information</li>
            </ul>
          </section>

          <section className="audit-card">
            <h2 className="text-xl font-semibold mb-4">Technical Measures</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement the following technical measures to protect anonymity:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-2">
              <li>No user authentication required</li>
              <li>No session tracking or persistent identifiers</li>
              <li>EXIF metadata stripped from uploaded images</li>
              <li>Server logs configured to not store IP addresses</li>
              <li>All data stored with row-level encryption</li>
            </ul>
          </section>

          <section className="audit-card">
            <h2 className="text-xl font-semibold mb-4">Third-Party Services</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use AI services for optical character recognition (OCR) and data extraction. 
              Images are processed through these services but are not stored or used for 
              training purposes beyond the immediate extraction task.
            </p>
          </section>

          <section className="audit-card">
            <h2 className="text-xl font-semibold mb-4">Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              Uploaded content is retained indefinitely as part of the public transparency 
              database. There is no mechanism to request deletion of specific uploads since 
              we cannot identify which uploads came from which user—by design.
            </p>
          </section>

          <section className="audit-card">
            <h2 className="text-xl font-semibold mb-4">Legal Requests</h2>
            <p className="text-muted-foreground leading-relaxed">
              We cannot comply with requests to identify specific users because we do not 
              collect identifying information. We may be required to remove specific content 
              upon valid legal notice, but we cannot identify who uploaded it.
            </p>
          </section>

          <section className="audit-card">
            <h2 className="text-xl font-semibold mb-4">Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              For privacy-related concerns or content removal requests, contact us through 
              the platform's designated channels. Note that we cannot identify or communicate 
              with individual uploaders.
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
}
