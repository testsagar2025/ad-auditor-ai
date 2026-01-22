import { Link } from "react-router-dom";
import { Shield, Search, Upload, FileText, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Shield className="h-8 w-8 text-destructive" />
          <span className="text-xl font-bold tracking-tight">
            Un<span className="text-destructive">Mask</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link
            to="/store"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Institutes
          </Link>
          <Link
            to="/scanner"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Scanner
          </Link>
          <Link
            to="/conflicts"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Conflicts
          </Link>
          <Link
            to="/about"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            About
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link to="/scanner">
              <Upload className="h-4 w-4 mr-2" />
              Upload Ad
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
