import { Link } from "react-router-dom";
import { Search, Upload, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import unmaskLogo from "@/assets/unmask-logo.png";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <img src={unmaskLogo} alt="UnMask" className="h-10 w-auto" />
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
          <Button variant="ghost" size="icon" asChild className="hidden">
            <Link to="/admin">
              <Settings className="h-4 w-4" />
            </Link>
          </Button>
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
