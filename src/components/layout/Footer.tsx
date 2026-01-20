import { Link } from "react-router-dom";
import { Shield } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-destructive" />
              <span className="text-lg font-bold">
                Un<span className="text-destructive">Mask</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground">
              A public-interest transparency platform auditing coaching institute advertisements.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Platform</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/store" className="hover:text-foreground transition-colors">
                  The Store
                </Link>
              </li>
              <li>
                <Link to="/scanner" className="hover:text-foreground transition-colors">
                  Ad Scanner
                </Link>
              </li>
              <li>
                <Link to="/conflicts" className="hover:text-foreground transition-colors">
                  Conflict Database
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/terms" className="hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/disclaimer" className="hover:text-foreground transition-colors">
                  Legal Disclaimer
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">About</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/about" className="hover:text-foreground transition-colors">
                  Our Mission
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-foreground transition-colors">
                  How It Works
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} UnMask. Consumer awareness & social audit platform.
          </p>
          <p className="text-xs text-muted-foreground">
            100% Anonymous • No User Tracking • Public Interest
          </p>
        </div>
      </div>
    </footer>
  );
}
