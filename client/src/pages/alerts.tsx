import { useState } from "react";
import {
  Bell,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  X,
  Save,
  MessageSquare,
  Mail,
  Smartphone,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
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

type Severity = "critical" | "warning" | "success" | "info";
type AlertStatus = "Active" | "Resolved" | "Dismissed";

interface Alert {
  id: string;
  severity: Severity;
  message: string;
  timestamp: string;
  dismissed?: boolean;
}

interface HistoryAlert {
  id: string;
  date: string;
  type: string;
  message: string;
  severity: Severity;
  status: AlertStatus;
}

interface AlertRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  threshold: number;
  unit: string;
  channels: {
    dashboard: boolean;
    sms: boolean;
    whatsapp: boolean;
    email: boolean;
  };
}

const INITIAL_ALERTS: Alert[] = [
  {
    id: "a1",
    severity: "warning",
    message: "3 schools haven't reported attendance in 5+ days",
    timestamp: "2024-03-10 09:15",
  },
  {
    id: "a2",
    severity: "critical",
    message: "Teacher attendance below 50% at Govt Primary School Badawa",
    timestamp: "2024-03-10 08:42",
  },
  {
    id: "a3",
    severity: "success",
    message: "Kano LGA achieved 90% visit coverage this month",
    timestamp: "2024-03-09 16:30",
  },
  {
    id: "a4",
    severity: "warning",
    message: "Resource request pending for 14 days: Textbooks at LEA School Kawo",
    timestamp: "2024-03-09 11:20",
  },
  {
    id: "a5",
    severity: "warning",
    message: "Average student attendance in Borno below 65% threshold",
    timestamp: "2024-03-08 14:05",
  },
  {
    id: "a6",
    severity: "info",
    message: "New attendance data uploaded for 142 schools in Kaduna",
    timestamp: "2024-03-08 10:00",
  },
];

const HISTORY_ALERTS: HistoryAlert[] = [
  { id: "h1",  date: "2024-03-05", type: "Attendance",       message: "5 schools missed 3 consecutive reporting days",             severity: "warning",  status: "Resolved"  },
  { id: "h2",  date: "2024-03-04", type: "Visit Coverage",   message: "Plateau LGA below 50% visit coverage",                     severity: "warning",  status: "Resolved"  },
  { id: "h3",  date: "2024-03-03", type: "Teacher Att.",     message: "Teacher attendance below 70% in 8 Borno schools",          severity: "critical", status: "Dismissed" },
  { id: "h4",  date: "2024-03-02", type: "Resource",         message: "ICT Equipment request aging — 18 days pending at Kaduna",  severity: "warning",  status: "Resolved"  },
  { id: "h5",  date: "2024-03-01", type: "Achievement",      message: "Lagos achieved 85% visit coverage — record high",          severity: "success",  status: "Resolved"  },
  { id: "h6",  date: "2024-02-28", type: "Attendance",       message: "Monthly attendance dipped below 70% national average",     severity: "warning",  status: "Dismissed" },
  { id: "h7",  date: "2024-02-27", type: "Teacher Att.",     message: "Teacher punctuality above 95% in Anambra — milestone",    severity: "success",  status: "Resolved"  },
  { id: "h8",  date: "2024-02-26", type: "Visit Coverage",   message: "Rivers LGA below 50% visit coverage for the month",       severity: "warning",  status: "Resolved"  },
  { id: "h9",  date: "2024-02-25", type: "Attendance",       message: "No attendance report from 7 schools for 5+ days",         severity: "critical", status: "Dismissed" },
  { id: "h10", date: "2024-02-24", type: "Resource",         message: "Toilet/Water request pending 20+ days in Bauchi",         severity: "critical", status: "Resolved"  },
  { id: "h11", date: "2024-02-22", type: "Attendance",       message: "Kano student attendance improved to 74% (above threshold)", severity: "success",  status: "Resolved"  },
  { id: "h12", date: "2024-02-20", type: "Visit Coverage",   message: "Kwara SSO coverage at 79% — above target",               severity: "success",  status: "Resolved"  },
  { id: "h13", date: "2024-02-18", type: "Teacher Att.",     message: "EdoBEST pilot schools — teacher presence 100% for week",  severity: "success",  status: "Resolved"  },
  { id: "h14", date: "2024-02-15", type: "Resource",         message: "Building repair request unapproved for 16 days",          severity: "warning",  status: "Dismissed" },
  { id: "h15", date: "2024-02-12", type: "Attendance",       message: "Borno student attendance below 55% — critical level",     severity: "critical", status: "Resolved"  },
];

const INITIAL_RULES: AlertRule[] = [
  {
    id: "r1",
    name: "No Attendance Report",
    description: "Trigger alert when a school has not submitted an attendance report",
    enabled: true,
    threshold: 3,
    unit: "days",
    channels: { dashboard: true, sms: false, whatsapp: false, email: true },
  },
  {
    id: "r2",
    name: "Low Student Attendance",
    description: "Alert when average student attendance falls below threshold",
    enabled: true,
    threshold: 65,
    unit: "%",
    channels: { dashboard: true, sms: true, whatsapp: false, email: true },
  },
  {
    id: "r3",
    name: "Low Teacher Attendance",
    description: "Alert when average teacher attendance falls below threshold",
    enabled: true,
    threshold: 70,
    unit: "%",
    channels: { dashboard: true, sms: true, whatsapp: true, email: false },
  },
  {
    id: "r4",
    name: "Visit Coverage",
    description: "Alert if the percentage of schools visited is below target",
    enabled: false,
    threshold: 50,
    unit: "%",
    channels: { dashboard: true, sms: false, whatsapp: false, email: false },
  },
  {
    id: "r5",
    name: "Resource Request Aging",
    description: "Alert when a resource request remains pending beyond threshold",
    enabled: true,
    threshold: 14,
    unit: "days",
    channels: { dashboard: true, sms: false, whatsapp: false, email: true },
  },
];

const SEVERITY_CONFIG: Record<Severity, { icon: React.ElementType; color: string; bg: string; badge: string }> = {
  critical: { icon: XCircle,        color: "text-red-500",    bg: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900",     badge: "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300" },
  warning:  { icon: AlertTriangle,  color: "text-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-900", badge: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/60 dark:text-yellow-300" },
  success:  { icon: CheckCircle2,   color: "text-green-500",  bg: "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900",   badge: "bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300" },
  info:     { icon: Info,           color: "text-blue-500",   bg: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900",     badge: "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300" },
};

const STATUS_COLORS: Record<AlertStatus, string> = {
  Active:    "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-300",
  Resolved:  "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300",
  Dismissed: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

export default function AlertsPage() {
  const { isDemoMode } = useAuth();
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<Alert[]>(INITIAL_ALERTS);
  const [rules, setRules] = useState<AlertRule[]>(INITIAL_RULES);

  const activeAlerts = alerts.filter(a => !a.dismissed);

  const handleDismiss = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, dismissed: true } : a));
    toast({ title: "Alert Dismissed", description: "Alert removed from active view." });
  };

  const handleRuleToggle = (id: string, enabled: boolean) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled } : r));
  };

  const handleThresholdChange = (id: string, value: string) => {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num > 0) {
      setRules(prev => prev.map(r => r.id === id ? { ...r, threshold: num } : r));
    }
  };

  const handleChannelToggle = (ruleId: string, channel: keyof AlertRule["channels"], value: boolean) => {
    setRules(prev => prev.map(r =>
      r.id === ruleId ? { ...r, channels: { ...r.channels, [channel]: value } } : r
    ));
  };

  const handleSaveConfig = () => {
    toast({
      title: "Configuration Saved",
      description: isDemoMode ? "Demo mode: Changes stored locally." : "Alert rules updated successfully.",
    });
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-[#01696F]/10 flex items-center justify-center">
          <Bell className="h-5 w-5 text-[#01696F]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Alerts &amp; Notifications</h1>
          <p className="text-sm text-muted-foreground">
            Monitor system alerts and configure notification rules
            {isDemoMode && <Badge variant="outline" className="ml-2 text-amber-600 border-amber-300 text-xs">Demo Mode</Badge>}
          </p>
        </div>
        {activeAlerts.length > 0 && (
          <Badge className="ml-auto bg-red-500 text-white text-xs">{activeAlerts.length} active</Badge>
        )}
      </div>

      <Tabs defaultValue="active">
        <TabsList className="grid w-full max-w-sm grid-cols-3">
          <TabsTrigger value="active" data-testid="tab-active-alerts">
            Active {activeAlerts.length > 0 && `(${activeAlerts.length})`}
          </TabsTrigger>
          <TabsTrigger value="configure" data-testid="tab-configure-rules">Configure</TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-alert-history">History</TabsTrigger>
        </TabsList>

        {/* TAB 1 — Active Alerts */}
        <TabsContent value="active" className="mt-4 space-y-3">
          {activeAlerts.length === 0 ? (
            <Card className="p-8 text-center">
              <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-3" />
              <p className="text-sm font-medium">No active alerts</p>
              <p className="text-xs text-muted-foreground mt-1">All systems are operating normally</p>
            </Card>
          ) : (
            activeAlerts.map(alert => {
              const cfg = SEVERITY_CONFIG[alert.severity];
              const Icon = cfg.icon;
              return (
                <div
                  key={alert.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${cfg.bg}`}
                  data-testid={`alert-${alert.id}`}
                >
                  <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${cfg.color}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{alert.message}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{alert.timestamp}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge className={`text-[10px] px-1.5 py-0 ${cfg.badge}`}>
                      {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 hover:bg-background/80"
                      onClick={() => handleDismiss(alert.id)}
                      data-testid={`button-dismiss-${alert.id}`}
                      aria-label="Dismiss alert"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </TabsContent>

        {/* TAB 2 — Configure Rules */}
        <TabsContent value="configure" className="mt-4 space-y-4">
          {rules.map(rule => (
            <Card key={rule.id} className={rule.enabled ? "" : "opacity-60"}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Switch
                    checked={rule.enabled}
                    onCheckedChange={v => handleRuleToggle(rule.id, v)}
                    data-testid={`toggle-rule-${rule.id}`}
                    className="mt-0.5 flex-shrink-0"
                  />
                  <div className="flex-1 space-y-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{rule.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{rule.description}</p>
                    </div>

                    <div className="flex flex-wrap gap-4 items-center">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground whitespace-nowrap">Threshold:</Label>
                        <Input
                          type="number"
                          min="1"
                          className="h-7 w-20 text-xs"
                          value={rule.threshold}
                          onChange={e => handleThresholdChange(rule.id, e.target.value)}
                          disabled={!rule.enabled}
                          data-testid={`input-threshold-${rule.id}`}
                        />
                        <span className="text-xs text-muted-foreground">{rule.unit}</span>
                      </div>

                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs text-muted-foreground">Notify via:</span>
                        {[
                          { key: "dashboard" as const, label: "Dashboard", Icon: Bell },
                          { key: "sms" as const, label: "SMS", Icon: Smartphone },
                          { key: "whatsapp" as const, label: "WhatsApp", Icon: MessageSquare },
                          { key: "email" as const, label: "Email", Icon: Mail },
                        ].map(({ key, label, Icon }) => (
                          <div key={key} className="flex items-center gap-1.5">
                            <Checkbox
                              id={`${rule.id}-${key}`}
                              checked={rule.channels[key]}
                              onCheckedChange={v => handleChannelToggle(rule.id, key, v as boolean)}
                              disabled={!rule.enabled}
                              data-testid={`checkbox-${rule.id}-${key}`}
                            />
                            <label htmlFor={`${rule.id}-${key}`} className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer">
                              <Icon className="h-3 w-3" />
                              {label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <Button
            className="bg-[#01696F] hover:bg-[#01696F]/90 text-white"
            onClick={handleSaveConfig}
            data-testid="button-save-config"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Configuration
          </Button>

          <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
            <CardContent className="p-3 flex items-start gap-2">
              <Info className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-800 dark:text-amber-300">
                SMS and WhatsApp notifications require Africa's Talking integration.
                Contact <strong>Harmony Digital Consults</strong> for setup and API credentials.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3 — Alert History */}
        <TabsContent value="history" className="mt-4">
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs">Type</TableHead>
                    <TableHead className="text-xs">Message</TableHead>
                    <TableHead className="text-xs text-center">Severity</TableHead>
                    <TableHead className="text-xs text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {HISTORY_ALERTS.map(h => {
                    const cfg = SEVERITY_CONFIG[h.severity];
                    const Icon = cfg.icon;
                    return (
                      <TableRow key={h.id} data-testid={`history-row-${h.id}`}>
                        <TableCell className="text-xs whitespace-nowrap">{h.date}</TableCell>
                        <TableCell className="text-xs font-medium">{h.type}</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[300px]">{h.message}</TableCell>
                        <TableCell className="text-center">
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${cfg.badge}`}>
                            <Icon className="h-2.5 w-2.5" />
                            {h.severity.charAt(0).toUpperCase() + h.severity.slice(1)}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={`text-[10px] px-1.5 py-0 ${STATUS_COLORS[h.status]}`}>
                            {h.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
