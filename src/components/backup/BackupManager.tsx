import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Database, 
  Download, 
  Upload, 
  Trash2, 
  Clock, 
  HardDrive, 
  Settings as SettingsIcon,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Calendar,
  FileText,
  Shield,
  Zap
} from 'lucide-react';
import { useBackupManager } from '@/hooks/useBackupManager';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export function BackupManager() {
  const [activeTab, setActiveTab] = useState('overview');
  
  const {
    backups,
    settings,
    isBackingUp,
    isRestoring,
    lastBackupTime,
    nextBackupTime,
    storageUsed,
    createBackup,
    restoreBackup,
    deleteBackup,
    clearAllBackups,
    forceClearStorage,
    downloadBackup,
    saveSettings,
    formatFileSize,
    getStorageInfo,
  } = useBackupManager();

  const { toast } = useToast();
  const storageInfo = getStorageInfo();

  const handleCreateBackup = async (type: 'full' | 'incremental') => {
    await createBackup(type);
  };

  const handleRestoreBackup = async (backupId: string) => {
    await restoreBackup(backupId);
  };

  const handleDeleteBackup = (backupId: string) => {
    if (window.confirm('Are you sure you want to delete this backup? This action cannot be undone.')) {
      deleteBackup(backupId);
    }
  };

  const handleClearAllBackups = () => {
    if (window.confirm('Are you sure you want to delete ALL backups? This action cannot be undone and will free up storage space.')) {
      clearAllBackups();
    }
  };

  const handleForceClearStorage = () => {
    if (window.confirm('Are you sure you want to reset ALL backup data and settings? This will clear everything and start fresh. This action cannot be undone.')) {
      forceClearStorage();
    }
  };

  const handleSettingsChange = (key: keyof typeof settings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
  };

  const getBackupTypeColor = (type: 'full' | 'incremental') => {
    return type === 'full' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
  };

  const getBackupTypeIcon = (type: 'full' | 'incremental') => {
    return type === 'full' ? <Database className="h-3 w-3" /> : <Zap className="h-3 w-3" />;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Backup & Restore</h3>
        <p className="text-sm text-muted-foreground">
          Automatically backup your data and restore from previous backups
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="backups">Backups</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="storage">Storage</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Backups</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{backups.length}</div>
                <p className="text-xs text-muted-foreground">
                  {backups.filter(b => b.type === 'full').length} full, {backups.filter(b => b.type === 'incremental').length} incremental
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Last Backup</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {lastBackupTime ? new Date(lastBackupTime).toLocaleDateString() : 'Never'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {lastBackupTime ? new Date(lastBackupTime).toLocaleTimeString() : 'No backups yet'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Next Backup</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {nextBackupTime ? new Date(nextBackupTime).toLocaleDateString() : 'Disabled'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {nextBackupTime ? new Date(nextBackupTime).toLocaleTimeString() : 'Auto backup disabled'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
                <HardDrive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{storageInfo.usedFormatted}</div>
                <p className="text-xs text-muted-foreground">
                  {storageInfo.usedPercentage}% of {storageInfo.maxFormatted}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Create backups or restore from existing ones
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Button 
                  onClick={() => handleCreateBackup('full')}
                  disabled={isBackingUp}
                  className="flex items-center gap-2"
                >
                  {isBackingUp ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Database className="h-4 w-4" />
                  )}
                  Create Full Backup
                </Button>
                
                <Button 
                  onClick={() => handleCreateBackup('incremental')}
                  disabled={isBackingUp || backups.length === 0}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  {isBackingUp ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4" />
                  )}
                  Create Incremental Backup
                </Button>
              </div>

              {settings.enabled && (
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    Automatic backups are enabled. Next backup scheduled for {nextBackupTime ? new Date(nextBackupTime).toLocaleString() : 'unknown'}.
                  </AlertDescription>
                </Alert>
              )}

              {storageInfo.isAtLimit && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Storage is at capacity! The system has automatically managed your backups. Consider using 'Download' storage option for long-term backups.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Backups Tab */}
        <TabsContent value="backups" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Backup History</CardTitle>
              <CardDescription>
                View and manage your backup files
              </CardDescription>
            </CardHeader>
            <CardContent>
              {backups.length === 0 ? (
                <div className="text-center py-8">
                  <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Backups Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first backup to start protecting your data
                  </p>
                  <Button onClick={() => handleCreateBackup('full')} disabled={isBackingUp}>
                    {isBackingUp ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Database className="h-4 w-4 mr-2" />
                    )}
                    Create First Backup
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {backups.map((backup) => (
                    <div
                      key={backup.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          {getBackupTypeIcon(backup.type)}
                          <Badge className={getBackupTypeColor(backup.type)}>
                            {backup.type}
                          </Badge>
                        </div>
                        
                        <div>
                          <div className="font-medium">
                            {new Date(backup.timestamp).toLocaleString()}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {backup.metadata.totalRecords} records • {formatFileSize(backup.size)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadBackup(backup)}
                          className="flex items-center gap-1"
                        >
                          <Download className="h-3 w-3" />
                          Download
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRestoreBackup(backup.id)}
                          disabled={isRestoring}
                          className="flex items-center gap-1"
                        >
                          {isRestoring ? (
                            <RefreshCw className="h-3 w-3 animate-spin" />
                          ) : (
                            <Upload className="h-3 w-3" />
                          )}
                          Restore
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteBackup(backup.id)}
                          className="flex items-center gap-1 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Backup Settings</CardTitle>
              <CardDescription>
                Configure automatic backup behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-backup">Enable Automatic Backups</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically create backups at scheduled intervals
                  </p>
                </div>
                <Switch
                  id="auto-backup"
                  checked={settings.enabled}
                  onCheckedChange={(checked) => handleSettingsChange('enabled', checked)}
                />
              </div>

              {settings.enabled && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="frequency">Backup Frequency</Label>
                    <Select
                      value={settings.frequency}
                      onValueChange={(value) => handleSettingsChange('frequency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="retention">Retention Period (Days)</Label>
                    <Input
                      id="retention"
                      type="number"
                      min="1"
                      max="365"
                      value={settings.retentionDays}
                      onChange={(e) => handleSettingsChange('retentionDays', parseInt(e.target.value))}
                    />
                    <p className="text-sm text-muted-foreground">
                      Backups older than this will be automatically deleted
                    </p>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="storage-location">Storage Location</Label>
                <Select
                  value={settings.storageLocation}
                  onValueChange={(value) => handleSettingsChange('storageLocation', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="local">Local Storage Only</SelectItem>
                    <SelectItem value="download">Download Only</SelectItem>
                    <SelectItem value="both">Both Local & Download</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Choose where to store your backups
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="include-photos">Include Photos</Label>
                  <p className="text-sm text-muted-foreground">
                    Include photo metadata in backups (photos themselves are stored separately)
                  </p>
                </div>
                <Switch
                  id="include-photos"
                  checked={settings.includePhotos}
                  onCheckedChange={(checked) => handleSettingsChange('includePhotos', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="compression">Enable Compression</Label>
                  <p className="text-sm text-muted-foreground">
                    Compress backup files to save storage space
                  </p>
                </div>
                <Switch
                  id="compression"
                  checked={settings.compression}
                  onCheckedChange={(checked) => handleSettingsChange('compression', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Storage Tab */}
        <TabsContent value="storage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Storage Information</CardTitle>
              <CardDescription>
                Monitor your backup storage usage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Backup Storage Used</span>
                  <span>{storageInfo.usedFormatted} / {storageInfo.maxFormatted}</span>
                </div>
                <Progress 
                  value={storageInfo.usedPercentage} 
                  className={cn(
                    "h-2",
                    storageInfo.isNearLimit && "bg-destructive"
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  {storageInfo.usedPercentage}% used (Backup data only)
                </p>
                
                <div className="flex justify-between text-sm">
                  <span>Total localStorage Used</span>
                  <span>{storageInfo.actualUsedFormatted} / {storageInfo.maxFormatted}</span>
                </div>
                <Progress 
                  value={storageInfo.actualUsedPercentage} 
                  className={cn(
                    "h-2",
                    storageInfo.actualUsedPercentage > 80 && "bg-destructive"
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  {storageInfo.actualUsedPercentage}% used (All data)
                </p>
              </div>

              {storageInfo.isAtLimit && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Storage is at capacity! Automatic cleanup has been applied. Consider reducing retention period or clearing old backups.
                  </AlertDescription>
                </Alert>
              )}

              {storageInfo.isNearLimit && !storageInfo.isAtLimit && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Storage is nearly full ({storageInfo.usedPercentage}%). Consider deleting old backups or reducing retention period.
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Storage Breakdown</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Full Backups:</span>
                      <span>{backups.filter(b => b.type === 'full').length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Incremental Backups:</span>
                      <span>{backups.filter(b => b.type === 'incremental').length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Size:</span>
                      <span>{formatFileSize(storageUsed)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Storage Management</h4>
                  <div className="space-y-3">
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Incremental backups save space</li>
                      <li>• Regular cleanup prevents storage issues</li>
                      <li>• Download backups for long-term storage</li>
                      <li>• Monitor storage usage regularly</li>
                    </ul>
                    
                    <div className="space-y-2">
                      {backups.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleClearAllBackups}
                          className="w-full text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Clear All Backups
                        </Button>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleForceClearStorage}
                        className="w-full text-destructive hover:text-destructive border-destructive"
                      >
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Reset All Data
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (window.confirm('Clear ALL localStorage data? This will remove all app data including auth, drafts, and backups. This action cannot be undone.')) {
                            localStorage.clear();
                            window.location.reload();
                          }
                        }}
                        className="w-full text-destructive hover:text-destructive border-destructive"
                      >
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Clear All localStorage
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
