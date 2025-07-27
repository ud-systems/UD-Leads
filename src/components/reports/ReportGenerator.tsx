import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Download, 
  Calendar, 
  BarChart3, 
  TrendingUp, 
  Users, 
  Store, 
  MapPin,
  Mail,
  Clock,
  Filter,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { EnhancedLineChart, EnhancedBarChart, EnhancedPieChart } from '@/components/charts/EnhancedCharts';

interface ReportConfig {
  type: 'analytics' | 'performance' | 'leads' | 'visits' | 'territories';
  format: 'pdf' | 'excel' | 'csv';
  dateRange: '7d' | '30d' | '90d' | '1y' | 'custom';
  customStartDate?: string;
  customEndDate?: string;
  includeCharts: boolean;
  includeData: boolean;
  filters: {
    status?: string;
    territory?: string;
    salesperson?: string;
    storeType?: string;
  };
  sections: string[];
}

const REPORT_TYPES = [
  { value: 'analytics', label: 'Analytics Report', icon: BarChart3 },
  { value: 'performance', label: 'Performance Report', icon: TrendingUp },
  { value: 'leads', label: 'Leads Report', icon: Store },
  { value: 'visits', label: 'Visits Report', icon: Calendar },
  { value: 'territories', label: 'Territories Report', icon: MapPin },
];

const REPORT_SECTIONS = {
  analytics: [
    'summary',
    'conversion_rates',
    'sales_performance',
    'territory_analysis',
    'trends',
  ],
  performance: [
    'kpi_overview',
    'salesperson_performance',
    'territory_performance',
    'monthly_comparison',
    'targets',
  ],
      leads: [
    'retailer_list',
    'status_distribution',
    'territory_mapping',
    'contact_info',
    'notes',
  ],
  visits: [
    'visit_schedule',
    'completion_rates',
    'salesperson_activity',
    'outcomes',
    'notes',
  ],
  territories: [
    'territory_overview',
    'retailer_distribution',
    'performance_metrics',
    'coverage_analysis',
  ],
};

export function ReportGenerator() {
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    type: 'analytics',
    format: 'pdf',
    dateRange: '30d',
    includeCharts: true,
    includeData: true,
    filters: {},
    sections: ['summary'],
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReports, setGeneratedReports] = useState<any[]>([]);
  
  const { toast } = useToast();
  const { canGenerateReports, canExport } = useRoleAccess();

  const handleConfigChange = (key: keyof ReportConfig, value: any) => {
    setReportConfig(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSectionToggle = (section: string) => {
    setReportConfig(prev => ({
      ...prev,
      sections: prev.sections.includes(section)
        ? prev.sections.filter(s => s !== section)
        : [...prev.sections, section],
    }));
  };

  const generateReport = async () => {
    if (!canGenerateReports) {
      toast({
        title: 'Access Denied',
        description: 'You do not have permission to generate reports.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newReport = {
        id: Date.now(),
        name: `${reportConfig.type.charAt(0).toUpperCase() + reportConfig.type.slice(1)} Report`,
        type: reportConfig.type,
        format: reportConfig.format,
        dateRange: reportConfig.dateRange,
        generatedAt: new Date().toISOString(),
        status: 'completed',
        downloadUrl: '#',
      };
      
      setGeneratedReports(prev => [newReport, ...prev]);
      
      toast({
        title: 'Report Generated',
        description: `${newReport.name} has been generated successfully.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadReport = (report: any) => {
    if (!canExport) {
      toast({
        title: 'Access Denied',
        description: 'You do not have permission to export reports.',
        variant: 'destructive',
      });
      return;
    }
    
    // Simulate download
    toast({
      title: 'Download Started',
      description: `Downloading ${report.name}...`,
    });
  };

  const getSampleChartData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return [
      {
        id: 'Sales',
        data: months.map((month, i) => ({
          x: month,
          y: Math.floor(Math.random() * 1000) + 500,
        })),
      },
      {
        id: 'Visits',
        data: months.map((month, i) => ({
          x: month,
          y: Math.floor(Math.random() * 200) + 50,
        })),
      },
    ];
  };

  const getSampleBarData = () => {
    return [
      { name: 'Vape Shop', value: 45 },
      { name: 'Convenience Store', value: 32 },
      { name: 'Supermarket', value: 23 },
    ];
  };

  const getSamplePieData = () => {
    return [
      { id: 'Converted', value: 35, color: '#10b981' },
      { id: 'In Discussion', value: 25, color: '#f59e0b' },
      { id: 'Trial Order', value: 20, color: '#3b82f6' },
      { id: 'No Status', value: 20, color: '#6b7280' },
    ];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Report Generator</h2>
          <p className="text-muted-foreground">
            Generate comprehensive reports for analytics and performance data
          </p>
        </div>
        <Button onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="configure" className="space-y-4">
        <TabsList>
          <TabsTrigger value="configure">Configure Report</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="history">Report History</TabsTrigger>
        </TabsList>

        <TabsContent value="configure" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Report Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Report Configuration
                </CardTitle>
                <CardDescription>
                  Configure the type and format of your report
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Report Type</Label>
                  <Select value={reportConfig.type} onValueChange={(value) => handleConfigChange('type', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REPORT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="h-4 w-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Export Format</Label>
                  <Select value={reportConfig.format} onValueChange={(value) => handleConfigChange('format', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF Document</SelectItem>
                      <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                      <SelectItem value="csv">CSV File</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Date Range</Label>
                  <Select value={reportConfig.dateRange} onValueChange={(value) => handleConfigChange('dateRange', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7d">Last 7 Days</SelectItem>
                      <SelectItem value="30d">Last 30 Days</SelectItem>
                      <SelectItem value="90d">Last 90 Days</SelectItem>
                      <SelectItem value="1y">Last Year</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {reportConfig.dateRange === 'custom' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={reportConfig.customStartDate}
                        onChange={(e) => handleConfigChange('customStartDate', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input
                        type="date"
                        value={reportConfig.customEndDate}
                        onChange={(e) => handleConfigChange('customEndDate', e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Report Options</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="includeCharts"
                        checked={reportConfig.includeCharts}
                        onCheckedChange={(checked) => handleConfigChange('includeCharts', checked)}
                      />
                      <Label htmlFor="includeCharts">Include Charts & Graphs</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="includeData"
                        checked={reportConfig.includeData}
                        onCheckedChange={(checked) => handleConfigChange('includeData', checked)}
                      />
                      <Label htmlFor="includeData">Include Raw Data</Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Report Sections */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Report Sections
                </CardTitle>
                <CardDescription>
                  Select which sections to include in your report
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {REPORT_SECTIONS[reportConfig.type as keyof typeof REPORT_SECTIONS]?.map((section) => (
                    <div key={section} className="flex items-center space-x-2">
                      <Checkbox
                        id={section}
                        checked={reportConfig.sections.includes(section)}
                        onCheckedChange={() => handleSectionToggle(section)}
                      />
                      <Label htmlFor={section} className="capitalize">
                        {section.replace('_', ' ')}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
              <CardDescription>
                Apply filters to narrow down the report data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={reportConfig.filters.status}
                    onValueChange={(value) => handleConfigChange('filters', { ...reportConfig.filters, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="converted">Converted</SelectItem>
                      <SelectItem value="in_discussion">In Discussion</SelectItem>
                      <SelectItem value="trial_order">Trial Order</SelectItem>
                      <SelectItem value="no_status">No Status</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Territory</Label>
                  <Select
                    value={reportConfig.filters.territory}
                    onValueChange={(value) => handleConfigChange('filters', { ...reportConfig.filters, territory: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Territories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="north">North Territory</SelectItem>
                      <SelectItem value="south">South Territory</SelectItem>
                      <SelectItem value="east">East Territory</SelectItem>
                      <SelectItem value="west">West Territory</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Store Type</Label>
                  <Select
                    value={reportConfig.filters.storeType}
                    onValueChange={(value) => handleConfigChange('filters', { ...reportConfig.filters, storeType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vape_shop">Vape Shop</SelectItem>
                      <SelectItem value="convenience_store">Convenience Store</SelectItem>
                      <SelectItem value="supermarket">Supermarket</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button 
              onClick={generateReport} 
              disabled={isGenerating || reportConfig.sections.length === 0}
              className="min-w-[200px]"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Report
                </>
              )}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Report Preview</CardTitle>
              <CardDescription>
                Preview of how your report will look
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {reportConfig.includeCharts && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <EnhancedLineChart
                    data={getSampleChartData()}
                    title="Sales & Visits Trend"
                    description="Monthly performance overview"
                    trend={{ value: 12.5, isPositive: true }}
                  />
                  <EnhancedBarChart
                    data={getSampleBarData()}
                    title="Store Type Distribution"
                    description="Retailer breakdown by type"
                  />
                  <EnhancedPieChart
                    data={getSamplePieData()}
                    title="Conversion Status"
                    description="Current retailer status distribution"
                  />
                </div>
              )}
              
              {reportConfig.includeData && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Sample Data</h3>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Raw data will be included in the exported report...
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Generated Reports</CardTitle>
              <CardDescription>
                View and download previously generated reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              {generatedReports.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No reports generated yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {generatedReports.map((report) => (
                    <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">{report.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Generated {new Date(report.generatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{report.format.toUpperCase()}</Badge>
                        <Button size="sm" onClick={() => downloadReport(report)}>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 