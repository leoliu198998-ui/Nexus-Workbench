'use client';

import { useState, useEffect, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchAllDialog } from './search-all-dialog';

import { CommonJob } from '@/lib/services/jenkins';

interface JenkinsSelectionControlsProps {
  jobName: string;
  onJobChange: (val: string) => void;
  serviceName?: string;
  onServiceChange?: (val: string) => void;
  
  commonJobs: CommonJob[];
  commonServices?: string[];
  
  // Available jobs in current view (name only is enough)
  jobsInView: { name: string }[];
  currentTab?: string;
}

export function JenkinsSelectionControls({
  jobName,
  onJobChange,
  serviceName,
  onServiceChange,
  commonJobs,
  commonServices = [],
  jobsInView,
  currentTab
}: JenkinsSelectionControlsProps) {
  
  // --- Temporary selections (Search All) ---
  const [tempJobs, setTempJobs] = useState<string[]>([]);
  
  // --- Search All Dialog State ---
  const [showJobSearch, setShowJobSearch] = useState(false);

  // --- Job Logic ---
  
  const jobOptions = useMemo(() => {
    // Create a map for quick lookup of job objects from the current view
    const jobMap = new Map(jobsInView.map(j => [j.name, j]));
    
    const options: { name: string }[] = [];
    const seen = new Set<string>();

    // 1. Add common jobs in the order defined in settings (commonJobs array)
    for (const job of commonJobs) {
      // Filter by scope if currentTab is provided
      if (currentTab && !job.scopes.includes(currentTab)) {
        continue;
      }
      
      if (!seen.has(job.name)) {
        if (jobMap.has(job.name)) {
          options.push(jobMap.get(job.name)!);
        } else {
          // Fallback: Add common job even if not in current view map
          // This ensures common jobs are always selectable
          options.push({ name: job.name });
        }
        seen.add(job.name);
      }
    }

    // 2. Add temporary jobs (from Search All)
    for (const name of tempJobs) {
       if (!seen.has(name)) {
         if (jobMap.has(name)) {
           options.push(jobMap.get(name)!);
         } else {
           options.push({ name });
         }
         seen.add(name);
       }
    }
    
    return options;
  }, [jobsInView, commonJobs, tempJobs, currentTab]);

  // Auto-select single job
  useEffect(() => {
    if (jobOptions.length === 1) {
      const singleJob = jobOptions[0].name;
      if (jobName !== singleJob) {
        onJobChange(singleJob);
      }
    }
  }, [jobOptions, jobName, onJobChange]);

  const handleSearchAllJobs = () => {
    setShowJobSearch(true);
  };

  const handleSelectJobFromSearch = (job: string) => {
    if (!tempJobs.includes(job)) {
      setTempJobs(prev => [...prev, job]);
    }
    onJobChange(job);
  };

  // Items for Job Search Dialog: All jobs in view MINUS current options
  const jobSearchItems = useMemo(() => {
    const currentOptionNames = new Set(jobOptions.map(j => j.name));
    return jobsInView.filter(j => !currentOptionNames.has(j.name)).map(j => j.name);
  }, [jobsInView, jobOptions]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
      {/* Job Selector */}
      <div className="grid gap-2">
        <div className="flex justify-between items-center">
           <Label>Job Name</Label>
           <button 
             onClick={handleSearchAllJobs}
             className="text-xs text-blue-500 hover:underline cursor-pointer"
           >
             Search All
           </button>
        </div>
        <Select value={jobName} onValueChange={onJobChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select job" />
          </SelectTrigger>
          <SelectContent>
            {jobOptions.map((j) => (
              <SelectItem key={j.name} value={j.name}>{j.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Service Selector (Optional) */}
      {onServiceChange && commonServices && (
        <div className="grid gap-2">
           <Label>Service Name (Optional)</Label>
           <Select value={serviceName || 'all'} onValueChange={onServiceChange}>
             <SelectTrigger className="w-full">
               <SelectValue placeholder="Select service to filter" />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="all">All Services</SelectItem>
               {commonServices.map((s) => (
                 <SelectItem key={s} value={s}>{s}</SelectItem>
               ))}
             </SelectContent>
           </Select>
        </div>
      )}

      {/* Dialogs */}
      <SearchAllDialog 
        open={showJobSearch} 
        onOpenChange={setShowJobSearch}
        title="Search Jobs"
        items={jobSearchItems}
        onSelect={handleSelectJobFromSearch}
      />
    </div>
  );
}