'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Check, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface WizardProps {
  children: React.ReactElement<WizardStepProps>[];
  onComplete?: () => void;
}

interface WizardStepProps {
  title: string;
  description?: string;
  children: React.ReactNode | ((next: () => void, prev: () => void) => React.ReactNode);
}

export const WizardStep: React.FC<WizardStepProps> = ({ children }) => {
  return <>{children}</>;
};

export const Wizard: React.FC<WizardProps> = ({ children, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = React.Children.count(children);

  const next = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else if (onComplete) {
      onComplete();
    }
  };

  const prev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const steps = React.Children.toArray(children) as React.ReactElement<WizardStepProps>[];
  const activeStep = steps[currentStep];

  return (
    <Card className="w-full border-border/60 bg-card/50 backdrop-blur-sm shadow-xl shadow-primary/5 overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] min-h-[500px]">
        {/* Sidebar Navigation */}
        <div className="bg-muted/30 border-b md:border-b-0 md:border-r border-border/60 p-6 md:p-8">
          <nav aria-label="Progress">
            <ol role="list" className="space-y-6">
              {steps.map((step, index) => {
                const isCompleted = index < currentStep;
                const isCurrent = index === currentStep;

                return (
                  <li key={step.props.title} className="relative">
                    {index !== steps.length - 1 && (
                      <div 
                        className={cn(
                          "absolute top-8 left-3.5 -ml-px h-full w-0.5",
                          isCompleted ? "bg-primary" : "bg-border"
                        )} 
                        aria-hidden="true" 
                      />
                    )}
                    <div className="group flex items-start">
                      <span className="flex items-center h-9">
                        <span className={cn(
                          "relative z-10 w-7 h-7 flex items-center justify-center rounded-full border-2 transition-all duration-300",
                          isCompleted ? "bg-primary border-primary" : 
                          isCurrent ? "bg-background border-primary ring-4 ring-primary/20" : 
                          "bg-background border-muted-foreground/30"
                        )}>
                          {isCompleted ? (
                            <Check className="w-3.5 h-3.5 text-primary-foreground" />
                          ) : (
                            <span className={cn("text-xs font-bold", isCurrent ? "text-primary" : "text-muted-foreground")}>
                              {index + 1}
                            </span>
                          )}
                        </span>
                      </span>
                      <span className="ml-4 flex min-w-0 flex-col pt-1">
                        <span className={cn("text-sm font-semibold tracking-wide uppercase", isCurrent ? "text-primary" : "text-muted-foreground")}>
                          {step.props.title}
                        </span>
                        {step.props.description && (
                          <span className="text-xs text-muted-foreground/70 mt-0.5">
                            {step.props.description}
                          </span>
                        )}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>

        {/* Content Area */}
        <div className="relative flex flex-col">
          <CardHeader className="border-b border-border/40 pb-6 px-8 pt-8">
             <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
               <span className="uppercase tracking-widest text-[10px] font-bold">Step {currentStep + 1}</span>
               <ChevronRight className="w-3 h-3" />
               <span className="font-medium text-foreground">{activeStep.props.title}</span>
             </div>
             <h2 className="text-2xl font-bold tracking-tight text-foreground">
               {activeStep.props.title}
             </h2>
             <p className="text-muted-foreground">
               {activeStep.props.description || "Follow the instructions to complete this step."}
             </p>
          </CardHeader>
          
          <CardContent className="flex-1 p-8 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="h-full"
              >
                {typeof activeStep.props.children === 'function'
                  ? activeStep.props.children(next, prev)
                  : activeStep.props.children}
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </div>
      </div>
    </Card>
  );
};