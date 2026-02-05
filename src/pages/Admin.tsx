import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  Lock,
  Eye,
  Upload,
  AlertTriangle,
  TrendingUp,
  Building2,
  Search,
  Save,
  Image,
  GraduationCap,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { CoachingInstitute } from "@/types/database";
import type { Tables } from "@/integrations/supabase/types";
import { ConflictResolution } from "@/components/admin/ConflictResolution";

const ADMIN_PASSWORD = "Admin@2026";

interface AnalyticsData {
  total_views: number;
  total_submissions: number;
  total_conflicts: number;
  daily_views: { date: string; count: number }[];
}

type ConflictRow = Tables<"conflicts">;

export default function Admin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [institutes, setInstitutes] = useState<CoachingInstitute[]>([]);
  const [conflicts, setConflicts] = useState<ConflictRow[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInstitute, setSelectedInstitute] = useState<CoachingInstitute | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    location: "",
    description: "",
    course_category: "JEE",
  });

  useEffect(() => {
    // Check if already authenticated in session
    const authStatus = sessionStorage.getItem("unmask_admin_auth");
    if (authStatus === "true") {
      setIsAuthenticated(true);
      loadData();
    } else {
      setIsLoading(false);
    }
  }, []);

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem("unmask_admin_auth", "true");
      loadData();
      toast({ title: "Welcome, Admin", description: "Dashboard access granted" });
    } else {
      toast({
        title: "Access Denied",
        description: "Invalid password",
        variant: "destructive",
      });
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load analytics
      const { data: analyticsEvents } = await supabase
        .from("analytics")
        .select("*")
        .order("created_at", { ascending: false });

      const viewEvents = analyticsEvents?.filter((e) => e.event_type === "page_view") || [];
      const submissionEvents = analyticsEvents?.filter((e) => e.event_type === "submission") || [];

      // Get conflicts count
      const { count: conflictsCount } = await supabase
        .from("conflicts")
        .select("*", { count: "exact", head: true });

      // Group views by date
      const dailyViews: { [key: string]: number } = {};
      viewEvents.forEach((event) => {
        const date = new Date(event.created_at).toLocaleDateString();
        dailyViews[date] = (dailyViews[date] || 0) + 1;
      });

      setAnalytics({
        total_views: viewEvents.length,
        total_submissions: submissionEvents.length,
        total_conflicts: conflictsCount || 0,
        daily_views: Object.entries(dailyViews).map(([date, count]) => ({ date, count })),
      });

      // Load institutes
      const { data: institutesData } = await supabase
        .from("coaching_institutes")
        .select("*")
        .order("name");

      setInstitutes((institutesData as CoachingInstitute[]) || []);

      // Load conflicts
      const { data: conflictsData } = await supabase
        .from("conflicts")
        .select("*")
        .order("created_at", { ascending: false });

      setConflicts(conflictsData || []);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectInstitute = (institute: CoachingInstitute) => {
    setSelectedInstitute(institute);
    setEditForm({
      location: institute.location || "",
      description: institute.description || "",
      course_category: (institute as any).course_category || "JEE",
    });
    setLogoPreview(institute.logo_url);
    setLogoFile(null);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setLogoPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSaveInstitute = async () => {
    if (!selectedInstitute) return;

    try {
      let logoUrl = selectedInstitute.logo_url;

      // Upload new logo if selected
      if (logoFile) {
        const fileName = `logos/${selectedInstitute.id}-${Date.now()}.${logoFile.name.split(".").pop()}`;
        const { error: uploadError } = await supabase.storage
          .from("newspaper-ads")
          .upload(fileName, logoFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("newspaper-ads")
          .getPublicUrl(fileName);

        logoUrl = urlData.publicUrl;
      }

      // Update institute
      const { error } = await supabase
        .from("coaching_institutes")
        .update({
          location: editForm.location || null,
          description: editForm.description || null,
          logo_url: logoUrl,
          course_category: editForm.course_category,
        })
        .eq("id", selectedInstitute.id);

      if (error) throw error;

      toast({ title: "Saved", description: "Institute updated successfully" });
      loadData();
      setSelectedInstitute(null);
    } catch (error) {
      console.error("Error saving:", error);
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive",
      });
    }
  };

  const filteredInstitutes = institutes.filter((i) =>
    i.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="container py-16 max-w-md">
          <Card className="border-primary/20">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Lock className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Admin Access</CardTitle>
              <CardDescription>Enter password to access the dashboard</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  placeholder="Enter admin password"
                />
              </div>
              <Button className="w-full" onClick={handleLogin}>
                <Shield className="h-4 w-4 mr-2" />
                Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-muted rounded w-48" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground">
              Monitor platform activity and manage institutes
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              sessionStorage.removeItem("unmask_admin_auth");
              setIsAuthenticated(false);
            }}
          >
            Logout
          </Button>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Eye className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{analytics?.total_views || 0}</div>
                  <p className="text-sm text-muted-foreground">Page Views</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center">
                  <Upload className="h-6 w-6 text-success" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{analytics?.total_submissions || 0}</div>
                  <p className="text-sm text-muted-foreground">Submissions</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{analytics?.total_conflicts || 0}</div>
                  <p className="text-sm text-muted-foreground">Conflicts</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{institutes.length}</div>
                  <p className="text-sm text-muted-foreground">Institutes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="institutes" className="space-y-6">
          <TabsList>
            <TabsTrigger value="institutes">
              <Building2 className="h-4 w-4 mr-2" />
              Institutes
            </TabsTrigger>
            <TabsTrigger value="conflicts">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Conflicts
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <TrendingUp className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="institutes" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Institute List */}
              <Card>
                <CardHeader>
                  <CardTitle>Manage Institutes</CardTitle>
                  <CardDescription>Select an institute to edit details or upload logo</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search institutes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <div className="max-h-[400px] overflow-y-auto space-y-2">
                    {filteredInstitutes.map((institute) => (
                      <div
                        key={institute.id}
                        onClick={() => handleSelectInstitute(institute)}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedInstitute?.id === institute.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                            {institute.logo_url ? (
                              <img
                                src={institute.logo_url}
                                alt={institute.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Building2 className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{institute.name}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{institute.total_claims} claims</span>
                              {institute.conflicted_claims > 0 && (
                                <Badge variant="destructive" className="text-xs">
                                  {institute.conflicted_claims} conflicts
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {(institute as any).course_category || "JEE"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Edit Form */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    {selectedInstitute ? selectedInstitute.name : "Select Institute"}
                  </CardTitle>
                  <CardDescription>
                    {selectedInstitute
                      ? "Edit institute details and upload logo"
                      : "Click on an institute to edit"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {selectedInstitute ? (
                    <>
                      {/* Logo Upload */}
                      <div className="space-y-2">
                        <Label>Institute Logo</Label>
                        <div className="flex items-center gap-4">
                          <div className="h-20 w-20 rounded-xl border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-muted">
                            {logoPreview ? (
                              <img
                                src={logoPreview}
                                alt="Logo preview"
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Image className="h-8 w-8 text-muted-foreground" />
                            )}
                          </div>
                          <label className="cursor-pointer">
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={handleLogoChange}
                              className="hidden"
                            />
                            <Button variant="outline" size="sm" asChild>
                              <span>
                                <Upload className="h-4 w-4 mr-2" />
                                Upload Logo
                              </span>
                            </Button>
                          </label>
                        </div>
                      </div>

                      {/* Course Category */}
                      <div className="space-y-2">
                        <Label htmlFor="course">Course Category</Label>
                        <Select
                          value={editForm.course_category}
                          onValueChange={(v) => setEditForm({ ...editForm, course_category: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="JEE">
                              <span className="flex items-center gap-2">
                                <GraduationCap className="h-4 w-4" />
                                JEE
                              </span>
                            </SelectItem>
                            <SelectItem value="NEET">
                              <span className="flex items-center gap-2">
                                <GraduationCap className="h-4 w-4" />
                                NEET
                              </span>
                            </SelectItem>
                            <SelectItem value="BOTH">
                              <span className="flex items-center gap-2">
                                <GraduationCap className="h-4 w-4" />
                                Both JEE & NEET
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Location */}
                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          value={editForm.location}
                          onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                          placeholder="e.g., Kota, Rajasthan"
                        />
                      </div>

                      {/* Description */}
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Input
                          id="description"
                          value={editForm.description}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          placeholder="Brief description..."
                        />
                      </div>

                      <Button className="w-full" onClick={handleSaveInstitute}>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </Button>
                    </>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Select an institute from the list to edit</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="conflicts" className="space-y-6">
            <ConflictResolution conflicts={conflicts} onUpdate={loadData} />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Page views over time</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics?.daily_views && analytics.daily_views.length > 0 ? (
                  <div className="space-y-4">
                    {analytics.daily_views.slice(0, 10).map((day, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground w-24">{day.date}</span>
                        <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{
                              width: `${Math.min(
                                (day.count / Math.max(...analytics.daily_views.map((d) => d.count))) * 100,
                                100
                              )}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium w-12 text-right">{day.count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No analytics data yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
