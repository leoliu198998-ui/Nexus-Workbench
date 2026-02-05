'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Search, Plus, Trash2, Edit, XCircle, X,
  Clock, CheckCircle2, AlertCircle,
  Copy, RefreshCw, ArrowUp, ArrowDown,
  Check
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { SearchAllDialog } from '@/components/jenkins/search-all-dialog';
import { JenkinsSelectionControls } from '@/components/jenkins/jenkins-selection-controls';
import type { JenkinsView, JenkinsJob, JenkinsBuildInfo, CommonJob } from '@/lib/services/jenkins';
import { toast } from 'sonner';

export default function JenkinsPage() {
  const [activeTab, setActiveTab] = useState('changed-tags');

  return (
    <div className="min-h-screen bg-background p-6 space-y-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Jenkins Toolkit</h1>
          <p className="text-muted-foreground mt-1">
            Monitor and manage your Jenkins pipelines.
          </p>
        </div>
      </header>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap gap-2 border-b pb-2">
        <TabButton id="changed-tags" label="Changed Tags" activeTab={activeTab} setActiveTab={setActiveTab} />
        <TabButton id="latest-build" label="Latest Build" activeTab={activeTab} setActiveTab={setActiveTab} />
        <TabButton id="verify-tag" label="Verify Tag" activeTab={activeTab} setActiveTab={setActiveTab} />
        <TabButton id="settings" label="Settings" activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      {/* Content */}
      <main className="space-y-6">
        {activeTab === 'changed-tags' && <ChangedTagsTab />}
        {activeTab === 'latest-build' && <LatestBuildTab />}
        {activeTab === 'verify-tag' && <VerifyTagTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </main>
    </div>
  );
}

function TabButton({ id, label, activeTab, setActiveTab }: { id: string, label: string, activeTab: string, setActiveTab: (id: string) => void }) {
  return (
    <Button 
      variant={activeTab === id ? 'default' : 'ghost'} 
      onClick={() => setActiveTab(id)}
      className="rounded-full"
    >
      {label}
    </Button>
  );
}

// --- Tab Components ---

function ChangedTagsTab() {
  const [jobName, setJobName] = useState('archegostest');
  const [commonJobs, setCommonJobs] = useState<CommonJob[]>([]);
  const [jobsInView, setJobsInView] = useState<{ name: string }[]>([]);
  
  const startDateRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [result, setResult] = useState<{ jobName: string; url: string; changedTags: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [iterationVersion, setIterationVersion] = useState('');
  const [copied, setCopied] = useState(false);

  const isFormValid = !!jobName;

  useEffect(() => {
    // Fetch common jobs
    fetch('/api/apps/jenkins/jobs/common').then(res => res.json()).then(data => {
      if (Array.isArray(data)) setCommonJobs(data);
    });

    // Fetch all jobs for search
    fetch('/api/apps/jenkins/views?name=all')
      .then(res => res.json())
      .then((data: JenkinsView) => {
        if (data && data.jobs) {
          setJobsInView(data.jobs.map(j => ({ name: j.name })));
        }
      })
      .catch(console.error);
  }, []);

  const handleQuery = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        jobName,
        ...(startDate && { startDate: startDate.replace(/-/g, '') }),
        ...(endDate && { endDate: endDate.replace(/-/g, '') }),
      });
      const res = await fetch(`/api/apps/jenkins/tags/changed?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch changed tags');
      const data = await res.json();
      setResult(data);
    } catch (error) {
      toast.error('Failed to query changed tags');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result?.changedTags) return;
    const text = result.changedTags;
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        if (!ok) throw new Error('execCommand copy failed');
      }
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Copy failed:', e);
      toast.error('Copy failed');
    }
  };

  const handleSync = async () => {
    if (!result?.changedTags || !iterationVersion) return;
    setSyncLoading(true);
    try {
      const docName = `Iteration ${iterationVersion} Butter Release Notes`;
      const res = await fetch('/api/integrations/wecom/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: result.changedTags,
          title: `Changed Tags: ${result.jobName} (${startDate || 'start'} - ${endDate || 'end'})`,
          docName: docName
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to sync');
      }
      
      toast.success(`Synced to '${docName}' successfully`);
      setSyncDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Failed to sync to WeCom');
    } finally {
      setSyncLoading(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Query Changed Tags</CardTitle>
          <CardDescription>Get changed APPS tags from Jenkins job</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <JenkinsSelectionControls
            jobName={jobName}
            onJobChange={setJobName}
            commonJobs={commonJobs}
            jobsInView={jobsInView}
            currentTab="Changed Tags"
          />
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Start Date</Label>
              <div className="relative">
                <Input 
                  ref={startDateRef}
                  type="date" 
                  value={startDate} 
                  max={endDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  onClick={() => startDateRef.current?.showPicker()}
                  className="pr-16 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-1"
                />
                {startDate && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setStartDate('')} 
                    className="absolute right-8 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground hover:text-foreground"
                    title="Clear start date"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
            <div className="grid gap-2">
              <Label>End Date</Label>
              <div className="relative">
                <Input 
                  ref={endDateRef}
                  type="date" 
                  value={endDate} 
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  onClick={() => endDateRef.current?.showPicker()}
                  className="pr-16 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-1"
                />
                {endDate && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setEndDate('')} 
                    className="absolute right-8 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground hover:text-foreground"
                    title="Clear end date"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>
          <Button onClick={handleQuery} disabled={loading || !isFormValid} className="w-full">
            {loading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
            Query Tags
          </Button>
        </CardContent>
      </Card>

      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Results</CardTitle>
          {result && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                Copy
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSyncDialogOpen(true)}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Sync
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {result ? (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground">Job: {result.jobName}</h4>
                <a href={result.url} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline">{result.url}</a>
              </div>
              <pre className="bg-muted p-4 rounded-md overflow-auto h-[300px] text-xs font-mono whitespace-pre-wrap">
                {result.changedTags}
              </pre>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
              No results to display
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={syncDialogOpen} onOpenChange={setSyncDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sync to WeCom Smart Sheet</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="iterationVersion">Iteration Version (XXX)</Label>
              <Input
                id="iterationVersion"
                value={iterationVersion}
                onChange={(e) => setIterationVersion(e.target.value)}
                placeholder="e.g. v1.2"
              />
              <p className="text-xs text-muted-foreground">
                Target Document: <span className="font-mono">Iteration {iterationVersion || 'XXX'} Butter Release Notes</span>
                <br />
                Folder: <span className="font-mono">发布管理</span>
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSyncDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSync} disabled={syncLoading || !iterationVersion}>
              {syncLoading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
              Sync Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LatestBuildTab() {
  const [jobName, setJobName] = useState('');
  const [serviceName, setServiceName] = useState('all');
  
  const [commonJobs, setCommonJobs] = useState<CommonJob[]>([]);
  const [commonServices, setCommonServices] = useState<string[]>([]);
  const [jobsInView, setJobsInView] = useState<{ name: string }[]>([]);

  const [result, setResult] = useState<JenkinsJob | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const isFormValid = !!jobName;

  useEffect(() => {
    // Fetch common data independently to avoid one failure blocking others
    const fetchCommonData = async () => {
      // 1. Common Jobs
      try {
        const jobsRes = await fetch('/api/apps/jenkins/jobs/common');
        if (jobsRes.ok) {
          const jobsData = await jobsRes.json();
          if (Array.isArray(jobsData)) setCommonJobs(jobsData);
        }
      } catch (e) {
        console.error('Failed to load common jobs', e);
      }

      // 2. Common Services
      try {
        const servicesRes = await fetch('/api/apps/jenkins/services/common');
        if (servicesRes.ok) {
          const servicesData = await servicesRes.json();
          if (Array.isArray(servicesData)) setCommonServices(servicesData);
        }
      } catch (e) {
        console.error('Failed to load common services', e);
      }

      // 3. All Jobs for Search
      try {
        const viewRes = await fetch('/api/apps/jenkins/views?name=all');
        if (viewRes.ok) {
           const viewData: JenkinsView = await viewRes.json();
           if (viewData && viewData.jobs) {
             setJobsInView(viewData.jobs.map(j => ({ name: j.name })));
           }
        }
      } catch (e) {
        console.error('Failed to load all jobs', e);
      }
    };

    fetchCommonData();
  }, []);

  const handleQuery = async () => {
    if (!jobName) {
      toast.error('Please enter a Job Name');
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({ 
        jobName,
        ...(serviceName && serviceName !== 'all' && { serviceName })
      });
      const res = await fetch(`/api/apps/jenkins/build/latest?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch latest build');
      const data = await res.json();
      setResult(data);
    } catch (error) {
      toast.error('Failed to query latest build');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Latest Build Info</CardTitle>
          <CardDescription>Get detailed info about the latest build</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <JenkinsSelectionControls
            jobName={jobName}
            onJobChange={setJobName}
            serviceName={serviceName}
            onServiceChange={setServiceName}
            commonJobs={commonJobs}
            commonServices={commonServices}
            jobsInView={jobsInView}
            currentTab="Latest Build"
          />
          <Button onClick={handleQuery} disabled={loading || !isFormValid} className="w-full">
            {loading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
            Get Status
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.lastSuccessfulBuild ? (
                <CheckCircle2 className="text-green-500 h-5 w-5" />
              ) : (
                <AlertCircle className="text-yellow-500 h-5 w-5" />
              )}
              {result.name}
            </CardTitle>
            <CardDescription>
              <a href={result.url} target="_blank" rel="noreferrer" className="hover:underline text-blue-500">
                Open in Jenkins
              </a>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.lastSuccessfulBuild && (
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold">Last Successful Build:</span>
                <span>#{result.lastSuccessfulBuild.number}</span>
              </div>
            )}
            <div className="border rounded-md p-4 bg-muted/50">
              <h4 className="text-sm font-semibold mb-2">Build Parameters</h4>
              <div className="space-y-4">
                 {result.parameters.map(param => {
                   if (param.name === 'APPS' && param.lastBuildValue) {
                     return (
                       <div key={param.name} className="flex flex-col gap-2 w-full">
                         <div className="flex justify-between items-center">
                           <span className="text-muted-foreground text-xs font-bold">{param.name}</span>
                           <Button 
                             variant="ghost" 
                             size="sm" 
                             className="h-6 px-2"
                             onClick={() => handleCopy(String(param.lastBuildValue))}
                           >
                             {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                             <span className="ml-1 text-xs">{copied ? 'Copied' : 'Copy'}</span>
                           </Button>
                         </div>
                         <div className="bg-background border rounded p-2 text-xs font-mono whitespace-pre-wrap overflow-auto max-h-[300px]">
                           {String(param.lastBuildValue)}
                         </div>
                       </div>
                     );
                   }
                   return (
                     <div key={param.name} className="flex flex-col">
                       <span className="text-muted-foreground text-xs">{param.name}</span>
                       <span className="font-mono truncate" title={String(param.lastBuildValue)}>
                         {String(param.lastBuildValue ?? '-')}
                       </span>
                     </div>
                   );
                 })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function VerifyTagTab() {
  const [selectedJob, setSelectedJob] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [result, setResult] = useState<JenkinsBuildInfo | null | { found: false }>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [commonJobs, setCommonJobs] = useState<CommonJob[]>([]);

  useEffect(() => {
    fetch('/api/apps/jenkins/jobs/common').then(res => res.json()).then(data => {
      if (Array.isArray(data)) {
        setCommonJobs(data);
        // Find first job that has 'Verify Tag' scope
        const validJob = data.find((j: CommonJob) => j.scopes.includes('Verify Tag'));
        if (!selectedJob && validJob) setSelectedJob(validJob.name);
      }
    }).catch(console.error);
  }, []);

  const validateTag = (val: string) => {
    if (!val) return '请输入要验证的 Tag';
    return '';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTagInput(val);
    setError(validateTag(val));
  };

  const handleVerify = async () => {
    if (!selectedJob) {
      setError('请选择 Job');
      return;
    }
    const validationError = validateTag(tagInput);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const params = new URLSearchParams({ 
        jobName: selectedJob, 
        tag: tagInput 
      });
      
      const res = await fetch(`/api/apps/jenkins/build/verify?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to verify tag');
      const data = await res.json();
      setResult(data);
    } catch (error) {
      toast.error('Failed to verify tag');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Verify Tag Build</CardTitle>
          <CardDescription>Check if a specific tag was built successfully</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 items-start">
            <div className="space-y-2">
              <Label>Job Name</Label>
              <Select value={selectedJob} onValueChange={setSelectedJob}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select job" />
                </SelectTrigger>
                <SelectContent>
                  {commonJobs
                    .filter(j => j.scopes.includes('Verify Tag'))
                    .map(j => (
                      <SelectItem key={j.name} value={j.name}>{j.name}</SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tag</Label>
              <Input 
                value={tagInput} 
                onChange={handleInputChange}
                placeholder="v0.28.32.2601201354" 
                className={error ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {error ? (
                <p className="text-xs text-red-500 font-medium animate-in slide-in-from-top-1">
                  {error}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  选择 Job 后输入要验证的 Tag
                </p>
              )}
            </div>
          </div>
          <Button onClick={handleVerify} disabled={loading || !!error || !(selectedJob && tagInput)} className="w-full">
            {loading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
            Verify
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card className={('found' in result && result.found === false) ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
          <CardContent className="pt-6 flex items-start gap-4">
            {('found' in result && result.found === false) ? (
              <>
                <XCircle className="h-6 w-6 text-red-500" />
                <div>
                  <h4 className="font-semibold text-red-700">Build Not Found</h4>
                  <p className="text-sm text-red-600">
                    Could not find a build with this tag in the last 5 builds.
                  </p>
                </div>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-6 w-6 text-green-500" />
                <div className="space-y-1">
                  <h4 className="font-semibold text-green-700">Build Found #{(result as JenkinsBuildInfo).number}</h4>
                  <div className="text-sm text-green-800 grid gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Status:</span>
                      <span>{(result as JenkinsBuildInfo).result || 'IN_PROGRESS'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      <span>{new Date((result as JenkinsBuildInfo).timestamp).toLocaleString()}</span>
                    </div>
                    <a href={(result as JenkinsBuildInfo).url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                      View Build Log
                    </a>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SettingsTab() {
  const [commonJobs, setCommonJobs] = useState<CommonJob[]>([]);
  const [newJobToAdd, setNewJobToAdd] = useState('');
  const [newJobScopes, setNewJobScopes] = useState<string[]>(['Changed Tags', 'Latest Build', 'Verify Tag']);

  const [commonServices, setCommonServices] = useState<string[]>([]);
  const [newServiceToAdd, setNewServiceToAdd] = useState('');
  
  // Job Search Dialog State
  const [showJobSearch, setShowJobSearch] = useState(false);
  const [showServiceSearch, setShowServiceSearch] = useState(false);
  const [viewJobs, setViewJobs] = useState<string[]>([]);
  const [loadingViewJobs, setLoadingViewJobs] = useState(false);
  const sourceView = 'all';

  useEffect(() => {
    const fetchData = async () => {
      // Common Jobs
      try {
        const res = await fetch('/api/apps/jenkins/jobs/common');
        if (res.ok) setCommonJobs(await res.json());
      } catch (e) { console.error(e); }

      // Common Services
      try {
        const res = await fetch('/api/apps/jenkins/services/common');
        if (res.ok) setCommonServices(await res.json());
      } catch (e) { console.error(e); }
    };
    
    fetchData();
  }, []);

  // Fetch jobs when sourceView changes
  useEffect(() => {
    setLoadingViewJobs(true);
    fetch(`/api/apps/jenkins/views?name=${sourceView}`)
      .then(res => res.json())
      .then((data: JenkinsView) => {
        if (data && data.jobs) {
          setViewJobs(data.jobs.map(j => j.name));
        } else {
          setViewJobs([]);
        }
      })
      .catch(err => {
        console.error('Failed to fetch jobs for view', err);
        setViewJobs([]);
      })
      .finally(() => setLoadingViewJobs(false));
  }, []);


  // --- Common Job Handlers ---

  const saveCommonJobs = async (jobs: CommonJob[]) => {
    try {
      const res = await fetch('/api/apps/jenkins/jobs/common', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobs),
      });
      if (!res.ok) throw new Error('Failed to save');
      setCommonJobs(jobs);
      toast.success('Common jobs updated');
    } catch (error) {
      console.error(error);
      toast.error('Failed to save common jobs');
    }
  };

  const addCommonJob = () => {
    if (!newJobToAdd) return;
    if (commonJobs.some(j => j.name === newJobToAdd)) {
      toast.error('Job already exists');
      return;
    }
    const newJob: CommonJob = {
      name: newJobToAdd,
      scopes: newJobScopes.length > 0 ? newJobScopes : ['Changed Tags', 'Latest Build', 'Verify Tag']
    };
    const updated = [...commonJobs, newJob];
    saveCommonJobs(updated);
    setNewJobToAdd('');
    setNewJobScopes(['Changed Tags', 'Latest Build', 'Verify Tag']);
  };

  const removeCommonJob = (name: string) => {
    const updated = commonJobs.filter(j => j.name !== name);
    saveCommonJobs(updated);
  };

  const moveCommonJob = (index: number, direction: 'up' | 'down') => {
    const newJobs = [...commonJobs];
    if (direction === 'up') {
      if (index === 0) return;
      [newJobs[index - 1], newJobs[index]] = [newJobs[index], newJobs[index - 1]];
    } else {
      if (index === newJobs.length - 1) return;
      [newJobs[index], newJobs[index + 1]] = [newJobs[index + 1], newJobs[index]];
    }
    saveCommonJobs(newJobs);
  };

  const handleScopeChange = (scope: string, checked: boolean) => {
    if (checked) {
      setNewJobScopes(prev => [...prev, scope]);
    } else {
      setNewJobScopes(prev => prev.filter(s => s !== scope));
    }
  };

  // --- Common Service Handlers ---

  const saveCommonServices = async (services: string[]) => {
    try {
      const res = await fetch('/api/apps/jenkins/services/common', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(services),
      });
      if (!res.ok) throw new Error('Failed to save');
      setCommonServices(services);
      toast.success('Common services updated');
    } catch (error) {
      console.error(error);
      toast.error('Failed to save common services');
    }
  };

  const addCommonService = () => {
    if (!newServiceToAdd) return;
    if (commonServices.includes(newServiceToAdd)) {
      toast.error('Service already exists');
      return;
    }
    const updated = [...commonServices, newServiceToAdd];
    saveCommonServices(updated);
    setNewServiceToAdd('');
  };

  const removeCommonService = (service: string) => {
    const updated = commonServices.filter(s => s !== service);
    saveCommonServices(updated);
  };

  const [editingJob, setEditingJob] = useState<CommonJob | null>(null);

  const handleEditJob = (job: CommonJob) => {
    setEditingJob({ ...job });
  };

  const saveEditedJob = () => {
    if (!editingJob) return;
    const updated = commonJobs.map(j => 
      j.name === editingJob.name ? editingJob : j
    );
    saveCommonJobs(updated);
    setEditingJob(null);
  };

  const handleEditScopeChange = (scope: string, checked: boolean) => {
    if (!editingJob) return;
    const currentScopes = editingJob.scopes;
    let newScopes;
    if (checked) {
      newScopes = [...currentScopes, scope];
    } else {
      newScopes = currentScopes.filter(s => s !== scope);
    }
    setEditingJob({ ...editingJob, scopes: newScopes });
  };

  return (
    <div className="space-y-8">
      {/* Edit Job Dialog */}
      <Dialog open={!!editingJob} onOpenChange={(open) => !open && setEditingJob(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Job Scopes</DialogTitle>
            <DialogDescription>
              Modify applicable scopes for <strong>{editingJob?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
             <div className="space-y-2">
               <Label>Applicable Scopes</Label>
               <div className="flex flex-col gap-2">
                 {['Changed Tags', 'Latest Build', 'Verify Tag'].map(scope => (
                   <div key={scope} className="flex items-center space-x-2">
                     <input
                       type="checkbox"
                       id={`edit-scope-${scope}`}
                       className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                       checked={editingJob?.scopes.includes(scope) || false}
                       onChange={(e) => handleEditScopeChange(scope, e.target.checked)}
                     />
                     <label
                       htmlFor={`edit-scope-${scope}`}
                       className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                     >
                       {scope}
                     </label>
                   </div>
                 ))}
               </div>
             </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingJob(null)}>Cancel</Button>
            <Button onClick={saveEditedJob}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Common Jobs Management */}
      <Card>
        <CardHeader>
          <CardTitle>Common Jobs</CardTitle>
          <CardDescription>Manage favorites for job dropdowns</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col gap-4">
             {/* Job Name Selection */}
             <div className="flex gap-2 items-end">
               <div className="space-y-2 w-[400px]">
                 <Label>Job Name</Label>
                 <div className="flex gap-2">
                   <Input 
                     value={newJobToAdd} 
                     onChange={(e) => setNewJobToAdd(e.target.value)} 
                     placeholder="Enter or select job..." 
                   />
                   <Button 
                     variant="outline" 
                     size="icon" 
                     onClick={() => setShowJobSearch(true)} 
                     disabled={loadingViewJobs}
                     title="Search Jobs"
                   >
                     <Search className="h-4 w-4" />
                   </Button>
                 </div>
               </div>
               <Button onClick={addCommonJob} disabled={!newJobToAdd}>
                 <Plus className="h-4 w-4 mr-2" /> Add
               </Button>
             </div>
             
             <div className="space-y-2">
               <Label>Applicable Scopes</Label>
               <div className="flex flex-wrap gap-4">
                 {['Changed Tags', 'Latest Build', 'Verify Tag'].map(scope => (
                   <div key={scope} className="flex items-center space-x-2">
                     <input
                       type="checkbox"
                       id={`scope-${scope}`}
                       className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                       checked={newJobScopes.includes(scope)}
                       onChange={(e) => handleScopeChange(scope, e.target.checked)}
                     />
                     <label
                       htmlFor={`scope-${scope}`}
                       className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                     >
                       {scope}
                     </label>
                   </div>
                 ))}
               </div>
             </div>
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job Name</TableHead>
                  <TableHead>Scopes</TableHead>
                  <TableHead className="w-[150px]">Order</TableHead>
                  <TableHead className="w-[100px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commonJobs.map((job, index) => (
                  <TableRow key={job.name}>
                    <TableCell>{job.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {job.scopes.map(scope => (
                          <span key={scope} className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                            {scope}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" disabled={index === 0} onClick={() => moveCommonJob(index, 'up')}>
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" disabled={index === commonJobs.length - 1} onClick={() => moveCommonJob(index, 'down')}>
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEditJob(job)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-red-500" onClick={() => removeCommonJob(job.name)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {commonJobs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                      No common jobs configured.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Common Services Management */}
      <Card>
        <CardHeader>
          <CardTitle>Common Services</CardTitle>
          <CardDescription>Manage favorites for service name filters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-2 items-end">
             <div className="space-y-2 w-[400px]">
               <Label>Service Name</Label>
               <div className="flex gap-2">
                 <Input 
                   value={newServiceToAdd} 
                   onChange={(e) => setNewServiceToAdd(e.target.value)} 
                   placeholder="Enter or select service..." 
                 />
                 <Button 
                   variant="outline" 
                   size="icon" 
                   onClick={() => setShowServiceSearch(true)} 
                   disabled={loadingViewJobs}
                   title="Search Services"
                 >
                   <Search className="h-4 w-4" />
                 </Button>
               </div>
             </div>
             <Button onClick={addCommonService} disabled={!newServiceToAdd}>
               <Plus className="h-4 w-4 mr-2" /> Add
             </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {commonServices.map(service => (
              <div key={service} className="flex items-center gap-2 bg-muted px-3 py-1 rounded-full text-sm">
                <span>{service}</span>
                <button onClick={() => removeCommonService(service)} className="text-muted-foreground hover:text-red-500">
                  <XCircle className="h-4 w-4" />
                </button>
              </div>
            ))}
             {commonServices.length === 0 && <p className="text-muted-foreground text-sm italic">No common services.</p>}
          </div>
        </CardContent>
      </Card>

      <SearchAllDialog 
        open={showJobSearch} 
        onOpenChange={setShowJobSearch}
        title="Search Jobs"
        items={viewJobs}
        onSelect={setNewJobToAdd}
        loading={loadingViewJobs}
      />

      <SearchAllDialog 
        open={showServiceSearch} 
        onOpenChange={setShowServiceSearch}
        title="Search Services"
        items={viewJobs}
        onSelect={setNewServiceToAdd}
        loading={loadingViewJobs}
      />
    </div>
  );
}
