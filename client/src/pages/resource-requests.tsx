import { useState } from "react";
import { PackagePlus, Filter, Plus, CheckCircle2, Clock, XCircle, Loader2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { STATE_DATA } from "@/lib/data";

type Priority = "Low" | "Medium" | "High" | "Urgent";
type Status = "Pending" | "Approved" | "In Progress" | "Completed" | "Rejected";
type Category =
  | "Furniture"
  | "Textbooks"
  | "Lab Equipment"
  | "Building Repair"
  | "Toilet/Water"
  | "Teaching Aids"
  | "ICT Equipment"
  | "Other";

interface ResourceRequest {
  id: string;
  date: string;
  school: string;
  state: string;
  category: Category;
  description: string;
  quantity: number;
  priority: Priority;
  status: Status;
}

const DEMO_REQUESTS: ResourceRequest[] = [
  { id: "RR001", date: "2024-03-10", school: "Govt Primary School Badawa", state: "Kano", category: "Textbooks", description: "Primary 4 Mathematics textbooks urgently needed", quantity: 120, priority: "Urgent", status: "Pending" },
  { id: "RR002", date: "2024-03-08", school: "LEA School Kawo", state: "Kano", category: "Furniture", description: "Replacement desks and chairs for 3 classrooms", quantity: 90, priority: "High", status: "Approved" },
  { id: "RR003", date: "2024-03-05", school: "St Mary's Primary School", state: "Lagos", category: "Toilet/Water", description: "Borehole pump replacement for school water supply", quantity: 1, priority: "High", status: "In Progress" },
  { id: "RR004", date: "2024-02-28", school: "Community Primary School Ibadan", state: "Oyo", category: "Lab Equipment", description: "Basic science lab equipment for JSS classes", quantity: 5, priority: "Medium", status: "Completed" },
  { id: "RR005", date: "2024-02-25", school: "Anglican Primary School Enugu", state: "Enugu", category: "Building Repair", description: "Roof repair — 2 classrooms affected by recent rains", quantity: 1, priority: "Urgent", status: "Pending" },
  { id: "RR006", date: "2024-02-20", school: "Federal School Kaduna", state: "Kaduna", category: "ICT Equipment", description: "10 tablets for e-learning pilot programme", quantity: 10, priority: "Medium", status: "Rejected" },
  { id: "RR007", date: "2024-02-18", school: "Community School Onitsha", state: "Anambra", category: "Teaching Aids", description: "Flip charts, markers, and A3 paper packs", quantity: 20, priority: "Low", status: "Approved" },
  { id: "RR008", date: "2024-02-15", school: "Govt Secondary Bauchi", state: "Bauchi", category: "Textbooks", description: "English language textbooks for Primary 1-3", quantity: 200, priority: "High", status: "Pending" },
  { id: "RR009", date: "2024-02-12", school: "LEA Primary Jos", state: "Plateau", category: "Furniture", description: "Teacher tables and chairs — 15 units", quantity: 15, priority: "Medium", status: "In Progress" },
  { id: "RR010", date: "2024-02-08", school: "Primary School Ilorin Central", state: "Kwara", category: "Other", description: "First aid kits and medicine cabinet for sick bay", quantity: 3, priority: "Medium", status: "Completed" },
  { id: "RR011", date: "2024-02-05", school: "Model Primary School Rivers", state: "Rivers", category: "Building Repair", description: "Classroom floor tiling — 4 rooms", quantity: 1, priority: "Low", status: "Pending" },
  { id: "RR012", date: "2024-01-30", school: "Girls Primary School Borno", state: "Borno", category: "Toilet/Water", description: "Construction of 4-unit toilet block for girl pupils", quantity: 1, priority: "Urgent", status: "Approved" },
];

const CATEGORIES: Category[] = [
  "Furniture", "Textbooks", "Lab Equipment", "Building Repair",
  "Toilet/Water", "Teaching Aids", "ICT Equipment", "Other",
];

const PRIORITY_COLORS: Record<Priority, string> = {
  Low: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
  Medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-300",
  High: "bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300",
  Urgent: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300",
};

const STATUS_COLORS: Record<Status, string> = {
  Pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-300",
  Approved: "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300",
  "In Progress": "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
  Completed: "bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400",
  Rejected: "bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400",
};

const STATUSES: Status[] = ["Pending", "Approved", "In Progress", "Completed", "Rejected"];

function StatusIcon({ status }: { status: Status }) {
  if (status === "Completed") return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />;
  if (status === "Rejected") return <XCircle className="h-3.5 w-3.5 text-red-500" />;
  if (status === "In Progress") return <Loader2 className="h-3.5 w-3.5 text-blue-500" />;
  return <Clock className="h-3.5 w-3.5 text-yellow-500" />;
}

export default function ResourceRequestsPage() {
  const { isDemoMode, profile } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<ResourceRequest[]>(DEMO_REQUESTS);

  // Submit form state
  const [formSchool, setFormSchool] = useState("");
  const [formState, setFormState] = useState("");
  const [formCategory, setFormCategory] = useState<Category | "">("");
  const [formDescription, setFormDescription] = useState("");
  const [formQuantity, setFormQuantity] = useState("");
  const [formPriority, setFormPriority] = useState<Priority | "">("");
  const [submitting, setSubmitting] = useState(false);

  // Filter state
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const summaryCards = [
    { label: "Total Requests", value: requests.length, icon: Package, color: "text-[#01696F]" },
    { label: "Pending", value: requests.filter(r => r.status === "Pending").length, icon: Clock, color: "text-yellow-600" },
    { label: "Approved", value: requests.filter(r => r.status === "Approved" || r.status === "In Progress").length, icon: CheckCircle2, color: "text-green-600" },
    { label: "Completed", value: requests.filter(r => r.status === "Completed").length, icon: CheckCircle2, color: "text-gray-500" },
  ];

  const filteredRequests = requests.filter(r => {
    if (filterStatus !== "all" && r.status !== filterStatus) return false;
    if (filterPriority !== "all" && r.priority !== filterPriority) return false;
    if (filterCategory !== "all" && r.category !== filterCategory) return false;
    return true;
  });

  const handleSubmit = async () => {
    if (!formSchool || !formCategory || !formDescription || !formQuantity || !formPriority) {
      toast({ title: "Incomplete Form", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 600));
    const newReq: ResourceRequest = {
      id: `RR${String(requests.length + 1).padStart(3, "0")}`,
      date: new Date().toISOString().split("T")[0],
      school: formSchool,
      state: formState || "Unknown",
      category: formCategory as Category,
      description: formDescription,
      quantity: parseInt(formQuantity, 10),
      priority: formPriority as Priority,
      status: "Pending",
    };
    setRequests(prev => [newReq, ...prev]);
    setFormSchool("");
    setFormState("");
    setFormCategory("");
    setFormDescription("");
    setFormQuantity("");
    setFormPriority("");
    setSubmitting(false);
    toast({ title: "Request Submitted", description: `Request ${newReq.id} has been submitted for review.` });
  };

  const handleStatusChange = (id: string, newStatus: Status) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
    toast({ title: "Status Updated", description: `Request ${id} status changed to ${newStatus}.` });
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-[#01696F]/10 flex items-center justify-center">
          <PackagePlus className="h-5 w-5 text-[#01696F]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Resource Requests</h1>
          <p className="text-sm text-muted-foreground">
            Submit and manage school resource needs
            {isDemoMode && <Badge variant="outline" className="ml-2 text-amber-600 border-amber-300 text-xs">Demo Mode</Badge>}
          </p>
        </div>
      </div>

      <Tabs defaultValue="all-requests">
        <TabsList className="grid w-full max-w-xs grid-cols-2">
          <TabsTrigger value="submit-request" data-testid="tab-submit-request">Submit Request</TabsTrigger>
          <TabsTrigger value="all-requests" data-testid="tab-all-requests">All Requests</TabsTrigger>
        </TabsList>

        {/* TAB 1 — Submit Request */}
        <TabsContent value="submit-request" className="mt-4">
          <Card className="max-w-xl">
            <CardHeader>
              <CardTitle className="text-base">New Resource Request</CardTitle>
              <CardDescription>Submit a request for school resources or repairs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="school-name">School Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="school-name"
                    data-testid="input-school-name"
                    placeholder="e.g. Govt Primary School Badawa"
                    value={formSchool}
                    onChange={e => setFormSchool(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>State</Label>
                  <Select value={formState} onValueChange={setFormState}>
                    <SelectTrigger data-testid="select-form-state">
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATE_DATA.map(s => <SelectItem key={s.state} value={s.state}>{s.state}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Category <span className="text-red-500">*</span></Label>
                  <Select value={formCategory} onValueChange={v => setFormCategory(v as Category)}>
                    <SelectTrigger data-testid="select-form-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Priority <span className="text-red-500">*</span></Label>
                  <Select value={formPriority} onValueChange={v => setFormPriority(v as Priority)}>
                    <SelectTrigger data-testid="select-form-priority">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {(["Low", "Medium", "High", "Urgent"] as Priority[]).map(p => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Quantity <span className="text-red-500">*</span></Label>
                <Input
                  type="number"
                  min="1"
                  data-testid="input-quantity"
                  placeholder="e.g. 50"
                  value={formQuantity}
                  onChange={e => setFormQuantity(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Description <span className="text-red-500">*</span></Label>
                <Textarea
                  data-testid="textarea-description"
                  placeholder="Describe the resource need in detail..."
                  rows={3}
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                />
              </div>

              <Button
                className="w-full bg-[#01696F] hover:bg-[#01696F]/90 text-white"
                onClick={handleSubmit}
                disabled={submitting}
                data-testid="button-submit-request"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Submitting…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Submit Request
                  </span>
                )}
              </Button>

              {isDemoMode && (
                <p className="text-xs text-muted-foreground text-center">
                  Demo mode: Requests stored in local state only
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2 — All Requests */}
        <TabsContent value="all-requests" className="mt-4 space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {summaryCards.map(card => {
              const Icon = card.icon;
              return (
                <Card key={card.label} className="p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">{card.label}</p>
                    <Icon className={`h-4 w-4 ${card.color}`} />
                  </div>
                  <p className={`text-2xl font-bold mt-1 ${card.color}`}>{card.value}</p>
                </Card>
              );
            })}
          </div>

          {/* Filters */}
          <Card className="p-3">
            <div className="flex flex-wrap gap-3 items-center">
              <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-8 w-36 text-xs" data-testid="filter-status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="h-8 w-36 text-xs" data-testid="filter-priority">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  {(["Low", "Medium", "High", "Urgent"] as Priority[]).map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="h-8 w-40 text-xs" data-testid="filter-category">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground ml-auto">
                {filteredRequests.length} of {requests.length} requests
              </span>
            </div>
          </Card>

          {/* Table */}
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">ID</TableHead>
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs">School / State</TableHead>
                    <TableHead className="text-xs">Category</TableHead>
                    <TableHead className="text-xs hidden md:table-cell">Description</TableHead>
                    <TableHead className="text-xs text-center">Qty</TableHead>
                    <TableHead className="text-xs text-center">Priority</TableHead>
                    <TableHead className="text-xs text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map(req => (
                    <TableRow key={req.id} data-testid={`row-request-${req.id}`}>
                      <TableCell className="text-xs font-mono text-muted-foreground">{req.id}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap">{req.date}</TableCell>
                      <TableCell className="text-xs">
                        <div className="font-medium">{req.school}</div>
                        <div className="text-muted-foreground">{req.state}</div>
                      </TableCell>
                      <TableCell className="text-xs">{req.category}</TableCell>
                      <TableCell className="text-xs text-muted-foreground hidden md:table-cell max-w-[200px] truncate">{req.description}</TableCell>
                      <TableCell className="text-xs text-center font-medium">{req.quantity}</TableCell>
                      <TableCell className="text-center">
                        <Badge className={`text-[10px] px-1.5 py-0 ${PRIORITY_COLORS[req.priority]}`}>
                          {req.priority}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Select
                          value={req.status}
                          onValueChange={v => handleStatusChange(req.id, v as Status)}
                        >
                          <SelectTrigger
                            className={`h-7 text-[10px] border-0 px-2 font-medium w-[110px] ${STATUS_COLORS[req.status]}`}
                            data-testid={`status-select-${req.id}`}
                          >
                            <div className="flex items-center gap-1">
                              <StatusIcon status={req.status} />
                              <SelectValue />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {filteredRequests.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No requests match the current filters</p>
              </div>
            )}
          </Card>

          {!isDemoMode && (
            <p className="text-xs text-muted-foreground text-center">
              Production mode: Add a <code className="bg-muted px-1 rounded">resource_requests</code> table to your Supabase project to persist data.
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
