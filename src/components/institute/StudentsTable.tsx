import { useMemo } from "react";
import { Award, Calendar, FileText, AlertTriangle, CheckCircle, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { maskPersonName } from "@/lib/privacy";
import type { TopperClaim } from "@/types/database";

interface StudentGroup {
  name: string;
  claims: TopperClaim[];
  totalRanks: number;
  hasConflict: boolean;
  yearRange: string;
  exams: string[];
}

interface StudentsTableProps {
  claims: TopperClaim[];
}

export function StudentsTable({ claims }: StudentsTableProps) {
  const studentGroups = useMemo(() => {
    const groups = new Map<string, StudentGroup>();

    claims.forEach((claim) => {
      const normalizedName = claim.topper_name.toLowerCase().trim();
      
      if (!groups.has(normalizedName)) {
        groups.set(normalizedName, {
          name: claim.topper_name,
          claims: [],
          totalRanks: 0,
          hasConflict: false,
          yearRange: "",
          exams: [],
        });
      }

      const group = groups.get(normalizedName)!;
      group.claims.push(claim);
      group.totalRanks++;
      if (claim.has_conflict) group.hasConflict = true;
      if (claim.exam_name && !group.exams.includes(claim.exam_name)) {
        group.exams.push(claim.exam_name);
      }
    });

    // Calculate year range for each student
    groups.forEach((group) => {
      const years = group.claims
        .map((c) => c.exam_year)
        .filter((y): y is number => y !== null)
        .sort();
      
      if (years.length > 0) {
        group.yearRange = years.length > 1 
          ? `${years[0]} - ${years[years.length - 1]}`
          : `${years[0]}`;
      }
    });

    return Array.from(groups.values()).sort((a, b) => b.totalRanks - a.totalRanks);
  }, [claims]);

  if (claims.length === 0) {
    return (
      <div className="text-center py-12">
        <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No students found</h3>
        <p className="text-muted-foreground">
          Claims will appear here grouped by student
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {studentGroups.length} unique students across {claims.length} claims
        </p>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Student Name</TableHead>
              <TableHead className="font-semibold">Ranks Claimed</TableHead>
              <TableHead className="font-semibold">Exams</TableHead>
              <TableHead className="font-semibold">Years</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {studentGroups.map((student, idx) => (
              <StudentRow key={idx} student={student} />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function StudentRow({ student }: { student: StudentGroup }) {
  const ranks = student.claims.map((c) => c.rank_claimed);
  const uniqueRanks = [...new Set(ranks)];

  return (
    <TableRow className={student.hasConflict ? "bg-destructive/5" : ""}>
      <TableCell>
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 text-primary flex-shrink-0" />
          <span className="font-medium">{maskPersonName(student.name)}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {uniqueRanks.slice(0, 3).map((rank, i) => (
            <Badge key={i} variant="secondary" className="text-xs">
              {rank}
            </Badge>
          ))}
          {uniqueRanks.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{uniqueRanks.length - 3} more
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {student.exams.map((exam, i) => (
            <span key={i} className="text-sm text-muted-foreground flex items-center gap-1">
              <FileText className="h-3 w-3" />
              {exam}
            </span>
          ))}
        </div>
      </TableCell>
      <TableCell>
        <span className="text-sm flex items-center gap-1">
          <Calendar className="h-3 w-3 text-muted-foreground" />
          {student.yearRange || "—"}
        </span>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {student.hasConflict ? (
            <Badge variant="destructive" className="text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Conflict
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs text-success border-success/30">
              <CheckCircle className="h-3 w-3 mr-1" />
              Clear
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">
            {student.totalRanks} claim{student.totalRanks > 1 ? "s" : ""}
          </span>
        </div>
      </TableCell>
    </TableRow>
  );
}
