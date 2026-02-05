 import { useState } from "react";
 import { Link } from "react-router-dom";
 import {
   AlertTriangle,
   Search,
   CheckCircle2,
   XCircle,
   Eye,
   Building2,
   Clock,
   Filter,
 } from "lucide-react";
 import { Badge } from "@/components/ui/badge";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "@/components/ui/select";
 import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
 } from "@/components/ui/card";
 import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
 } from "@/components/ui/dialog";
 import { Textarea } from "@/components/ui/textarea";
 import { Label } from "@/components/ui/label";
 import { useToast } from "@/hooks/use-toast";
 import { supabase } from "@/integrations/supabase/client";
 import { cn } from "@/lib/utils";
 import { maskPersonName } from "@/lib/privacy";
 import type { Tables } from "@/integrations/supabase/types";
 
 type ConflictRow = Tables<"conflicts">;
 
 interface ConflictResolutionProps {
   conflicts: ConflictRow[];
   onUpdate: () => void;
 }
 
 type ResolutionStatus = "unresolved" | "investigating" | "confirmed" | "dismissed";
 
 const STATUS_CONFIG: Record<
   ResolutionStatus,
   { label: string; icon: React.ElementType; color: string; bgColor: string }
 > = {
   unresolved: {
     label: "Unresolved",
     icon: AlertTriangle,
     color: "text-warning",
     bgColor: "bg-warning/10",
   },
   investigating: {
     label: "Investigating",
     icon: Eye,
     color: "text-primary",
     bgColor: "bg-primary/10",
   },
   confirmed: {
     label: "Confirmed",
     icon: CheckCircle2,
     color: "text-destructive",
     bgColor: "bg-destructive/10",
   },
   dismissed: {
     label: "Dismissed",
     icon: XCircle,
     color: "text-muted-foreground",
     bgColor: "bg-muted",
   },
 };
 
 export function ConflictResolution({ conflicts, onUpdate }: ConflictResolutionProps) {
   const { toast } = useToast();
   const [searchQuery, setSearchQuery] = useState("");
   const [statusFilter, setStatusFilter] = useState<string>("all");
   const [severityFilter, setSeverityFilter] = useState<string>("all");
   const [selectedConflict, setSelectedConflict] = useState<ConflictRow | null>(null);
   const [newStatus, setNewStatus] = useState<ResolutionStatus>("unresolved");
   const [resolutionNotes, setResolutionNotes] = useState("");
   const [isUpdating, setIsUpdating] = useState(false);
 
   const filteredConflicts = conflicts.filter((conflict) => {
     const matchesSearch =
       searchQuery === "" ||
       conflict.topper_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
       conflict.rank_claimed.toLowerCase().includes(searchQuery.toLowerCase());
 
     const matchesStatus =
       statusFilter === "all" || conflict.status === statusFilter;
 
     const matchesSeverity =
       severityFilter === "all" || conflict.severity === severityFilter;
 
     return matchesSearch && matchesStatus && matchesSeverity;
   });
 
   const handleOpenResolution = (conflict: ConflictRow) => {
     setSelectedConflict(conflict);
     setNewStatus(conflict.status as ResolutionStatus);
     setResolutionNotes("");
   };
 
   const handleUpdateStatus = async () => {
     if (!selectedConflict) return;
 
     setIsUpdating(true);
     try {
       const { error } = await supabase
         .from("conflicts")
         .update({
           status: newStatus,
           updated_at: new Date().toISOString(),
         })
         .eq("id", selectedConflict.id);
 
       if (error) throw error;
 
       toast({
         title: "Status Updated",
         description: `Conflict marked as ${STATUS_CONFIG[newStatus].label}`,
       });
 
       setSelectedConflict(null);
       onUpdate();
     } catch (error) {
       console.error("Error updating conflict:", error);
       toast({
         title: "Error",
         description: "Failed to update conflict status",
         variant: "destructive",
       });
     } finally {
       setIsUpdating(false);
     }
   };
 
   const getSeverityStyles = (severity: string) => {
     switch (severity) {
       case "critical":
         return "bg-destructive text-destructive-foreground";
       case "high":
         return "bg-destructive/80 text-white";
       case "medium":
         return "bg-warning text-warning-foreground";
       default:
         return "bg-muted text-muted-foreground";
     }
   };
 
   const statusCounts = {
     unresolved: conflicts.filter((c) => c.status === "unresolved").length,
     investigating: conflicts.filter((c) => c.status === "investigating").length,
     confirmed: conflicts.filter((c) => c.status === "confirmed").length,
     dismissed: conflicts.filter((c) => c.status === "dismissed").length,
   };
 
   return (
     <>
       {/* Status Overview Cards */}
       <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
         {(Object.keys(STATUS_CONFIG) as ResolutionStatus[]).map((status) => {
           const config = STATUS_CONFIG[status];
           const Icon = config.icon;
           return (
             <Card
               key={status}
               className={cn(
                 "cursor-pointer transition-colors",
                 statusFilter === status && "ring-2 ring-primary"
               )}
               onClick={() =>
                 setStatusFilter(statusFilter === status ? "all" : status)
               }
             >
               <CardContent className="pt-4 pb-3">
                 <div className="flex items-center gap-3">
                   <div
                     className={cn(
                       "h-10 w-10 rounded-lg flex items-center justify-center",
                       config.bgColor
                     )}
                   >
                     <Icon className={cn("h-5 w-5", config.color)} />
                   </div>
                   <div>
                     <div className="text-2xl font-bold">{statusCounts[status]}</div>
                     <p className="text-xs text-muted-foreground">{config.label}</p>
                   </div>
                 </div>
               </CardContent>
             </Card>
           );
         })}
       </div>
 
       <Card>
         <CardHeader>
           <CardTitle>Conflict Resolution</CardTitle>
           <CardDescription>
             Review and update conflict status. Mark as investigated, confirmed, or dismissed.
           </CardDescription>
         </CardHeader>
         <CardContent className="space-y-4">
           {/* Filters */}
           <div className="flex flex-col sm:flex-row gap-3">
             <div className="relative flex-1">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
               <Input
                 placeholder="Search conflicts..."
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="pl-10"
               />
             </div>
             <Select value={statusFilter} onValueChange={setStatusFilter}>
               <SelectTrigger className="w-full sm:w-[160px]">
                 <Filter className="h-4 w-4 mr-2" />
                 <SelectValue placeholder="Status" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="all">All Status</SelectItem>
                 <SelectItem value="unresolved">Unresolved</SelectItem>
                 <SelectItem value="investigating">Investigating</SelectItem>
                 <SelectItem value="confirmed">Confirmed</SelectItem>
                 <SelectItem value="dismissed">Dismissed</SelectItem>
               </SelectContent>
             </Select>
             <Select value={severityFilter} onValueChange={setSeverityFilter}>
               <SelectTrigger className="w-full sm:w-[160px]">
                 <SelectValue placeholder="Severity" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="all">All Severity</SelectItem>
                 <SelectItem value="critical">Critical</SelectItem>
                 <SelectItem value="high">High</SelectItem>
                 <SelectItem value="medium">Medium</SelectItem>
                 <SelectItem value="low">Low</SelectItem>
               </SelectContent>
             </Select>
           </div>
 
           {/* Conflicts List */}
           <div className="space-y-2 max-h-[500px] overflow-y-auto">
             {filteredConflicts.length === 0 ? (
               <div className="text-center py-8 text-muted-foreground">
                 <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                 <p>No conflicts match your filters</p>
               </div>
             ) : (
               filteredConflicts.map((conflict) => {
                 const statusConfig =
                   STATUS_CONFIG[conflict.status as ResolutionStatus] ||
                   STATUS_CONFIG.unresolved;
                 const StatusIcon = statusConfig.icon;
 
                 return (
                   <div
                     key={conflict.id}
                     className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                   >
                     <div className="flex items-start gap-4">
                       <div
                         className={cn(
                           "h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0",
                           statusConfig.bgColor
                         )}
                       >
                         <StatusIcon className={cn("h-5 w-5", statusConfig.color)} />
                       </div>
 
                       <div className="flex-1 min-w-0">
                         <div className="flex items-start justify-between gap-2">
                           <div>
                             <h4 className="font-medium">
                               {maskPersonName(conflict.topper_name)}
                             </h4>
                             <p className="text-sm text-primary font-medium">
                               {conflict.rank_claimed}
                             </p>
                           </div>
                           <div className="flex items-center gap-2">
                             <Badge
                               className={cn("text-xs", getSeverityStyles(conflict.severity))}
                             >
                               {conflict.severity}
                             </Badge>
                             <Badge variant="outline" className="text-xs">
                               {statusConfig.label}
                             </Badge>
                           </div>
                         </div>
 
                         <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                           <span className="flex items-center gap-1">
                             <Building2 className="h-3 w-3" />
                             {conflict.institute_ids?.length || 0} institutes
                           </span>
                           <span>
                             {conflict.exam_name} {conflict.exam_year}
                           </span>
                           <span className="flex items-center gap-1">
                             <Clock className="h-3 w-3" />
                             {new Date(conflict.created_at).toLocaleDateString()}
                           </span>
                         </div>
 
                         <div className="flex gap-2 mt-3">
                           <Button
                             size="sm"
                             variant="outline"
                             onClick={() => handleOpenResolution(conflict)}
                           >
                             Update Status
                           </Button>
                           <Button size="sm" variant="ghost" asChild>
                             <Link to={`/conflicts/${conflict.id}`}>View Details</Link>
                           </Button>
                         </div>
                       </div>
                     </div>
                   </div>
                 );
               })
             )}
           </div>
         </CardContent>
       </Card>
 
       {/* Resolution Dialog */}
       <Dialog
         open={selectedConflict !== null}
         onOpenChange={(open) => !open && setSelectedConflict(null)}
       >
         <DialogContent>
           <DialogHeader>
             <DialogTitle>Update Conflict Status</DialogTitle>
             <DialogDescription>
               Change the resolution status for this conflict.
             </DialogDescription>
           </DialogHeader>
 
           {selectedConflict && (
             <div className="space-y-4">
               {/* Conflict Summary */}
               <div className="p-3 rounded-lg bg-muted/50">
                 <p className="font-medium">
                   {maskPersonName(selectedConflict.topper_name)}
                 </p>
                 <p className="text-sm text-primary">{selectedConflict.rank_claimed}</p>
                 <p className="text-xs text-muted-foreground mt-1">
                   {selectedConflict.exam_name} {selectedConflict.exam_year} •{" "}
                   {selectedConflict.institute_ids?.length || 0} institutes involved
                 </p>
               </div>
 
               {/* Status Selection */}
               <div className="space-y-2">
                 <Label>New Status</Label>
                 <div className="grid grid-cols-2 gap-2">
                   {(Object.keys(STATUS_CONFIG) as ResolutionStatus[]).map((status) => {
                     const config = STATUS_CONFIG[status];
                     const Icon = config.icon;
                     return (
                       <Button
                         key={status}
                         type="button"
                         variant={newStatus === status ? "default" : "outline"}
                         className={cn(
                           "justify-start gap-2",
                           newStatus === status && config.bgColor,
                           newStatus === status && config.color
                         )}
                         onClick={() => setNewStatus(status)}
                       >
                         <Icon className="h-4 w-4" />
                         {config.label}
                       </Button>
                     );
                   })}
                 </div>
               </div>
 
               {/* Notes */}
               <div className="space-y-2">
                 <Label htmlFor="notes">Resolution Notes (Optional)</Label>
                 <Textarea
                   id="notes"
                   placeholder="Add any notes about this resolution..."
                   value={resolutionNotes}
                   onChange={(e) => setResolutionNotes(e.target.value)}
                   rows={3}
                 />
               </div>
             </div>
           )}
 
           <DialogFooter>
             <Button variant="outline" onClick={() => setSelectedConflict(null)}>
               Cancel
             </Button>
             <Button onClick={handleUpdateStatus} disabled={isUpdating}>
               {isUpdating ? "Updating..." : "Update Status"}
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>
     </>
   );
 }