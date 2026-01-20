import { Layout } from "@/components/layout/Layout";

export default function Terms() {
  return (
    <Layout>
      <div className="container py-16 max-w-3xl">
        <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
        
        <div className="prose prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <section className="audit-card">
            <h2 className="text-xl font-semibold mb-4">1. Platform Nature</h2>
            <p className="text-muted-foreground leading-relaxed">
              UnMask is an intermediary platform that hosts user-generated content for public 
              interest purposes. We do not create, verify, or endorse the content uploaded by 
              users. The platform serves as a neutral repository for consumer awareness information 
              about coaching institute advertising practices.
            </p>
          </section>

          <section className="audit-card">
            <h2 className="text-xl font-semibold mb-4">2. User Responsibilities</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              By using this platform, you agree that:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>You will only upload authentic newspaper advertisements</li>
              <li>You are responsible for the accuracy of any manual data entry</li>
              <li>You will not upload defamatory, false, or malicious content</li>
              <li>You understand that uploaded content becomes part of a public database</li>
              <li>You will not attempt to identify or dox other users</li>
            </ul>
          </section>

          <section className="audit-card">
            <h2 className="text-xl font-semibold mb-4">3. Intermediary Status</h2>
            <p className="text-muted-foreground leading-relaxed">
              UnMask operates as an intermediary under the Information Technology Act, 2000 
              (India) and equivalent legislation. As an intermediary, we are not liable for 
              user-generated content. We follow due diligence requirements including content 
              removal upon valid legal notice.
            </p>
          </section>

          <section className="audit-card">
            <h2 className="text-xl font-semibold mb-4">4. Content Usage</h2>
            <p className="text-muted-foreground leading-relaxed">
              All uploaded content may be used for:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-2">
              <li>Public display on the platform</li>
              <li>Statistical analysis and deception scoring</li>
              <li>Conflict detection across institutes</li>
              <li>Generation of complaint documents</li>
              <li>Academic research on advertising practices</li>
            </ul>
          </section>

          <section className="audit-card">
            <h2 className="text-xl font-semibold mb-4">5. No Warranty</h2>
            <p className="text-muted-foreground leading-relaxed">
              The platform is provided "as is" without warranty of any kind. We do not guarantee 
              the accuracy of AI-extracted data, deception scores, or conflict detection. Users 
              should verify information independently before taking any action.
            </p>
          </section>

          <section className="audit-card">
            <h2 className="text-xl font-semibold mb-4">6. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              UnMask and its operators shall not be liable for any damages arising from the use 
              of this platform, including but not limited to: reliance on platform data, actions 
              taken based on deception scores, or consequences of filing complaints using 
              generated documents.
            </p>
          </section>

          <section className="audit-card">
            <h2 className="text-xl font-semibold mb-4">7. Content Removal</h2>
            <p className="text-muted-foreground leading-relaxed">
              We will remove content upon receiving valid legal notice as per applicable law. 
              To request content removal, contact us with specific details of the content and 
              legal basis for removal.
            </p>
          </section>

          <section className="audit-card">
            <h2 className="text-xl font-semibold mb-4">8. Modifications</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to modify these terms at any time. Continued use of the 
              platform after changes constitutes acceptance of modified terms.
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
}
