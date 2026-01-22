import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Building2, FileDown } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useConflict } from "@/hooks/useConflicts";
import { useQuery } from "@tanstack/react-query";
import type { CoachingInstitute, TopperClaim } from "@/types/database";
import { maskPersonName } from "@/lib/privacy";

type ClaimsByInstitute = Record<string, TopperClaim[]>;

export default function ConflictDetail() {
  const { id } = useParams();
  const { data: conflict, isLoading: conflictLoading } = useConflict(id || "");

  const { data: claims, isLoading: claimsLoading } = useQuery({
    queryKey: ["conflict-claims", conflict?.id],
    enabled: !!conflict?.claim_ids?.length,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("topper_claims")
        .select("*")
        .in("id", conflict!.claim_ids);
      if (error) throw error;
      return (data ?? []) as TopperClaim[];
    },
  });

  const { data: institutes, isLoading: institutesLoading } = useQuery({
    queryKey: ["conflict-institutes", conflict?.id],
    enabled: !!conflict?.institute_ids?.length,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coaching_institutes")
        .select("*")
        .in("id", conflict!.institute_ids);
      if (error) throw error;
      return (data ?? []) as CoachingInstitute[];
    },
  });

  const claimsByInstitute: ClaimsByInstitute = useMemo(() => {
    const grouped: ClaimsByInstitute = {};
    for (const c of claims ?? []) {
      const key = c.institute_id ?? "unknown";
      grouped[key] = grouped[key] ? [...grouped[key], c] : [c];
    }
    return grouped;
  }, [claims]);

  const isLoading = conflictLoading || claimsLoading || institutesLoading;

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 rounded bg-muted" />
            <div className="h-28 rounded bg-muted" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-56 rounded bg-muted" />
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!conflict) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <AlertTriangle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Conflict Not Found</h2>
          <p className="text-muted-foreground mb-6">
            This conflict record doesn&apos;t exist or has been removed.
          </p>
          <Button asChild>
            <Link to="/conflicts">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Conflicts
            </Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        <Button variant="ghost" size="sm" className="mb-6" asChild>
          <Link to="/conflicts">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Conflicts
          </Link>
        </Button>

        <div className="audit-card mb-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">
                {maskPersonName(conflict.topper_name)} — {conflict.rank_claimed}
              </h1>
              <p className="text-sm text-muted-foreground">
                {conflict.exam_name} {conflict.exam_year}
              </p>
              <div className="flex items-center gap-2 mt-3">
                <Badge variant="destructive">{conflict.severity}</Badge>
                <Badge variant="outline">{conflict.status}</Badge>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link to={`/report/conflict/${conflict.id}`}>
                  <FileDown className="h-4 w-4 mr-2" />
                  Generate Report
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Evidence by Institute</h2>
            <p className="text-sm text-muted-foreground">
              {conflict.institute_ids.length} institutes • {conflict.claim_ids.length} claims
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {(institutes ?? []).map((inst) => {
              const instClaims = claimsByInstitute[inst.id] ?? [];
              return (
                <Card key={inst.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-muted overflow-hidden flex items-center justify-center">
                        {inst.logo_url ? (
                          <img
                            src={inst.logo_url}
                            alt={inst.name}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <Building2 className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <Link
                          to={`/store/${inst.id}`}
                          className="hover:underline underline-offset-4"
                        >
                          {inst.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">Score {inst.deception_score}/100</p>
                      </div>
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {instClaims.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No linked claim rows found.</p>
                    ) : (
                      instClaims.map((c) => (
                        <div key={c.id} className="rounded-lg border border-border bg-card">
                          <div className="p-3">
                            <p className="text-sm font-medium">
                              {maskPersonName(c.topper_name)} — {c.rank_claimed}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {c.exam_name} {c.exam_year}
                              {c.newspaper_name ? ` • ${c.newspaper_name}` : ""}
                            </p>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-3 pt-0">
                            <div className="rounded-md overflow-hidden bg-muted aspect-[4/3]">
                              <img
                                src={c.newspaper_image_url}
                                alt={`Evidence ad for ${inst.name}`}
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                            </div>
                            <div className="text-xs text-muted-foreground leading-relaxed">
                              {c.fine_print ? (
                                <div className="rounded-md border border-warning/20 bg-warning/10 p-2">
                                  <p className="font-medium text-warning">Fine print</p>
                                  <p>{c.fine_print}</p>
                                </div>
                              ) : (
                                <div className="rounded-md border border-border bg-muted/30 p-2">
                                  <p className="font-medium">Fine print</p>
                                  <p>Not detected</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      </div>
    </Layout>
  );
}
