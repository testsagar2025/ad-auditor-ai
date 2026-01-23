import { useState } from "react";
import { Search, Filter, Building2, AlertTriangle, TrendingDown, GraduationCap } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InstituteCard } from "@/components/store/InstituteCard";
import { useInstitutes } from "@/hooks/useInstitutes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type CourseFilter = "all" | "JEE" | "NEET" | "BOTH";

export default function Store() {
  const { data: institutes, isLoading } = useInstitutes();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("deception");
  const [courseFilter, setCourseFilter] = useState<CourseFilter>("all");

  const filteredInstitutes = institutes
    ?.filter((institute) => {
      const matchesSearch = institute.name.toLowerCase().includes(searchQuery.toLowerCase());
      const instituteCategory = (institute as any).course_category || "JEE";
      const matchesCourse = 
        courseFilter === "all" || 
        instituteCategory === courseFilter || 
        instituteCategory === "BOTH";
      return matchesSearch && matchesCourse;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "deception":
          return b.deception_score - a.deception_score;
        case "conflicts":
          return b.conflicted_claims - a.conflicted_claims;
        case "claims":
          return b.total_claims - a.total_claims;
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

  return (
    <Layout>
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Institutes Database</h1>
          <p className="text-muted-foreground">
            Browse the database of coaching institutes and their deception scores
          </p>
        </div>

        {/* Course Filter Pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(["all", "JEE", "NEET"] as const).map((course) => (
            <Button
              key={course}
              variant={courseFilter === course ? "default" : "outline"}
              size="sm"
              onClick={() => setCourseFilter(course)}
              className="gap-2"
            >
              <GraduationCap className="h-4 w-4" />
              {course === "all" ? "All Courses" : course}
            </Button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search institutes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="deception">
                <span className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Deception Score
                </span>
              </SelectItem>
              <SelectItem value="conflicts">
                <span className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4" />
                  Most Conflicts
                </span>
              </SelectItem>
              <SelectItem value="claims">
                <span className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Total Claims
                </span>
              </SelectItem>
              <SelectItem value="name">Name (A-Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="audit-card animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 rounded-lg bg-muted" />
                  <div className="flex-1 space-y-3">
                    <div className="h-5 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                    <div className="h-4 bg-muted rounded w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredInstitutes?.length === 0 ? (
          <div className="text-center py-16">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No institutes found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? "Try adjusting your search query"
                : "Be the first to upload an advertisement"}
            </p>
            <Button asChild>
              <a href="/scanner">Upload an Ad</a>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredInstitutes?.map((institute) => (
              <InstituteCard key={institute.id} institute={institute} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
