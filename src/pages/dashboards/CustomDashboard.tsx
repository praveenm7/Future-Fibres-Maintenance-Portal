import { useState, useCallback, useMemo } from 'react';
import {
  ResponsiveGridLayout,
  type Layout,
  type LayoutItem,
  type ResponsiveLayouts,
} from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { DashboardShell } from '@/components/dashboards/DashboardShell';
import { KPICard } from '@/components/dashboards/KPICard';
import { ChartCard } from '@/components/dashboards/ChartCard';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ActionButton } from '@/components/ui/ActionButton';
import {
  Plus,
  Trash2,
  Save,
  RotateCcw,
  GripVertical,
  BarChart3,
  PieChart,
  TrendingUp,
  Hash,
  Settings2,
  AlertTriangle,
  Package,
  Users,
  Activity,
} from 'lucide-react';
import { useDashboards } from '@/hooks/useDashboards';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];

const STORAGE_KEY = 'ff-custom-dashboard';

// --- Widget types ---

type WidgetType = 'kpi-machines' | 'kpi-ncs' | 'kpi-spare-parts' | 'kpi-operators'
  | 'chart-machines-area' | 'chart-nc-status' | 'chart-nc-trend' | 'chart-spare-stock';

interface WidgetConfig {
  id: string;
  type: WidgetType;
}

interface WidgetDefinition {
  type: WidgetType;
  label: string;
  description: string;
  icon: React.ElementType;
  category: 'KPI' | 'Chart';
  defaultW: number;
  defaultH: number;
}

const WIDGET_CATALOG: WidgetDefinition[] = [
  { type: 'kpi-machines', label: 'Total Machines', description: 'Count of all registered machines', icon: Settings2, category: 'KPI', defaultW: 3, defaultH: 2 },
  { type: 'kpi-ncs', label: 'Open NCs', description: 'Non-conformities currently open', icon: AlertTriangle, category: 'KPI', defaultW: 3, defaultH: 2 },
  { type: 'kpi-spare-parts', label: 'Spare Parts', description: 'Total spare parts in inventory', icon: Package, category: 'KPI', defaultW: 3, defaultH: 2 },
  { type: 'kpi-operators', label: 'Operators', description: 'Authorized maintenance operators', icon: Users, category: 'KPI', defaultW: 3, defaultH: 2 },
  { type: 'chart-machines-area', label: 'Machines by Area', description: 'Bar chart of machines per area', icon: BarChart3, category: 'Chart', defaultW: 6, defaultH: 4 },
  { type: 'chart-nc-status', label: 'NC Status', description: 'Pie chart of NC status distribution', icon: PieChart, category: 'Chart', defaultW: 6, defaultH: 4 },
  { type: 'chart-nc-trend', label: 'NC Trend', description: 'Monthly NC creation trend', icon: TrendingUp, category: 'Chart', defaultW: 6, defaultH: 4 },
  { type: 'chart-spare-stock', label: 'Spare Parts Stock', description: 'Top spare parts by quantity', icon: Hash, category: 'Chart', defaultW: 6, defaultH: 4 },
];

// --- Persistence helpers ---

interface SavedDashboard {
  widgets: WidgetConfig[];
  layouts: Record<string, LayoutItem[]>;
}

function loadDashboard(): SavedDashboard | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function saveDashboard(widgets: WidgetConfig[], layouts: Record<string, LayoutItem[]>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ widgets, layouts }));
}

// --- Default dashboard ---

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: 'w1', type: 'kpi-machines' },
  { id: 'w2', type: 'kpi-ncs' },
  { id: 'w3', type: 'kpi-spare-parts' },
  { id: 'w4', type: 'kpi-operators' },
  { id: 'w5', type: 'chart-machines-area' },
  { id: 'w6', type: 'chart-nc-status' },
];

const DEFAULT_LAYOUTS: Record<string, LayoutItem[]> = {
  lg: [
    { i: 'w1', x: 0, y: 0, w: 3, h: 2 },
    { i: 'w2', x: 3, y: 0, w: 3, h: 2 },
    { i: 'w3', x: 6, y: 0, w: 3, h: 2 },
    { i: 'w4', x: 9, y: 0, w: 3, h: 2 },
    { i: 'w5', x: 0, y: 2, w: 6, h: 4 },
    { i: 'w6', x: 6, y: 2, w: 6, h: 4 },
  ],
};

// --- Component ---

export default function CustomDashboard() {
  const saved = useMemo(() => loadDashboard(), []);
  const [widgets, setWidgets] = useState<WidgetConfig[]>(saved?.widgets || DEFAULT_WIDGETS);
  const [layouts, setLayouts] = useState<Record<string, LayoutItem[]>>(saved?.layouts || DEFAULT_LAYOUTS);
  const [pickerOpen, setPickerOpen] = useState(false);

  const { useOverview, useNCAnalytics, useSparePartsAnalytics, useWorkforce } = useDashboards();
  const { data: overview, isLoading: loadingOverview } = useOverview();
  const { data: ncData } = useNCAnalytics();
  const { data: spareData, isLoading: loadingSP } = useSparePartsAnalytics();
  const { data: workforce, isLoading: loadingWF } = useWorkforce();

  const handleLayoutChange = useCallback((_layout: Layout, allLayouts: ResponsiveLayouts) => {
    // Convert readonly Layout arrays to mutable LayoutItem arrays for storage
    const mutableLayouts: Record<string, LayoutItem[]> = {};
    for (const [key, val] of Object.entries(allLayouts)) {
      if (val) mutableLayouts[key] = [...val];
    }
    setLayouts(mutableLayouts);
  }, []);

  const handleSave = () => {
    saveDashboard(widgets, layouts);
  };

  const handleReset = () => {
    if (confirm('Reset dashboard to default layout?')) {
      setWidgets(DEFAULT_WIDGETS);
      setLayouts(DEFAULT_LAYOUTS);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const addWidget = (type: WidgetType) => {
    const def = WIDGET_CATALOG.find(w => w.type === type)!;
    const id = `w${Date.now()}`;
    setWidgets(prev => [...prev, { id, type }]);
    setLayouts(prev => {
      const lgLayout = prev.lg || [];
      const maxY = lgLayout.reduce((max, l) => Math.max(max, l.y + l.h), 0);
      return {
        ...prev,
        lg: [...lgLayout, { i: id, x: 0, y: maxY, w: def.defaultW, h: def.defaultH }],
      };
    });
    setPickerOpen(false);
  };

  const removeWidget = (id: string) => {
    setWidgets(prev => prev.filter(w => w.id !== id));
    setLayouts(prev => {
      const newLayouts: Record<string, LayoutItem[]> = {};
      for (const [bp, layout] of Object.entries(prev)) {
        newLayouts[bp] = layout.filter(l => l.i !== id);
      }
      return newLayouts;
    });
  };

  const renderWidget = (widget: WidgetConfig) => {
    switch (widget.type) {
      case 'kpi-machines':
        return (
          <KPICard
            title="Total Machines"
            value={overview?.totalMachines ?? 0}
            icon={Settings2}
            isLoading={loadingOverview}
          />
        );
      case 'kpi-ncs':
        return (
          <KPICard
            title="Open NCs"
            value={overview?.openNCs ?? 0}
            icon={AlertTriangle}
            colorClass="text-amber-500"
            isLoading={loadingOverview}
          />
        );
      case 'kpi-spare-parts':
        return (
          <KPICard
            title="Spare Parts"
            value={spareData?.totalParts ?? 0}
            icon={Package}
            colorClass="text-green-500"
            isLoading={loadingSP}
          />
        );
      case 'kpi-operators':
        return (
          <KPICard
            title="Operators"
            value={workforce?.totalOperators ?? 0}
            icon={Users}
            colorClass="text-blue-500"
            isLoading={loadingWF}
          />
        );
      case 'chart-machines-area':
        return (
          <ChartCard title="Machines by Area">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={overview?.machinesByArea || []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="area" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        );
      case 'chart-nc-status':
        return (
          <ChartCard title="NC Status Distribution">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPie>
                <Pie
                  data={ncData?.byStatus || []}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius="70%"
                  label={({ name, percent }: { name: string; percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {(ncData?.byStatus || []).map((_: unknown, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPie>
            </ResponsiveContainer>
          </ChartCard>
        );
      case 'chart-nc-trend':
        return (
          <ChartCard title="NC Monthly Trend">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ncData?.monthlyTrend || []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        );
      case 'chart-spare-stock':
        return (
          <ChartCard title="Spare Parts Stock">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={(spareData?.topParts || []).slice(0, 10)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="description" tick={{ fontSize: 10 }} width={120} />
                <Tooltip />
                <Bar dataKey="quantity" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        );
      default:
        return <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Unknown widget</div>;
    }
  };

  // Convert layouts to the format expected by ResponsiveGridLayout (ResponsiveLayouts)
  const responsiveLayouts: ResponsiveLayouts = layouts;

  return (
    <DashboardShell
      title="Custom Dashboard"
      subtitle="Drag, resize, and customize your personal dashboard"
      filters={
        <div className="flex items-center gap-2">
          <ActionButton variant="green" onClick={() => setPickerOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add Widget
          </ActionButton>
          <ActionButton variant="blue" onClick={handleSave}>
            <Save className="h-4 w-4 mr-1" /> Save Layout
          </ActionButton>
          <ActionButton variant="red" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-1" /> Reset
          </ActionButton>
        </div>
      }
    >
      {widgets.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-border rounded-lg bg-muted/20">
          <Activity className="h-12 w-12 text-muted-foreground/20 mb-4" />
          <p className="text-lg font-medium text-muted-foreground mb-2">Your dashboard is empty</p>
          <p className="text-sm text-muted-foreground/60 mb-4">Add widgets to build your custom view</p>
          <ActionButton variant="green" onClick={() => setPickerOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add Your First Widget
          </ActionButton>
        </div>
      ) : (
        <ResponsiveGridLayout
          layouts={responsiveLayouts}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
          cols={{ lg: 12, md: 8, sm: 4, xs: 2 }}
          rowHeight={60}
          onLayoutChange={handleLayoutChange}
          dragConfig={{ enabled: true, handle: '.drag-handle', threshold: 3, bounded: false }}
          resizeConfig={{ enabled: true, handles: ['se'] }}
        >
          {widgets.map((widget) => (
            <div key={widget.id} className="relative group">
              {/* Drag handle + remove button overlay */}
              <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="drag-handle cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted/80">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                </div>
                <button
                  type="button"
                  onClick={() => removeWidget(widget.id)}
                  className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                  title="Remove widget"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="h-full pt-2">
                {renderWidget(widget)}
              </div>
            </div>
          ))}
        </ResponsiveGridLayout>
      )}

      {/* Widget Picker Dialog */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Widget</DialogTitle>
            <DialogDescription>Choose a widget to add to your dashboard.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {(['KPI', 'Chart'] as const).map((category) => (
              <div key={category}>
                <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
                  {category === 'KPI' ? 'Key Metrics' : 'Charts'}
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {WIDGET_CATALOG.filter(w => w.category === category).map((def) => {
                    const Icon = def.icon;
                    return (
                      <button
                        key={def.type}
                        type="button"
                        onClick={() => addWidget(def.type)}
                        className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors text-left"
                      >
                        <div className="mt-0.5 p-1.5 rounded bg-primary/10">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{def.label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{def.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
