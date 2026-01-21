'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface WizardProps {
  children: React.ReactElement<WizardStepProps>[];
  onComplete?: () => void;
}

interface WizardStepProps {
  title: string;
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
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          Step {currentStep + 1} of {totalSteps}: {activeStep.props.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {typeof activeStep.props.children === 'function'
          ? activeStep.props.children(next, prev)
          : activeStep.props.children}
      </CardContent>
    </Card>
  );
};
