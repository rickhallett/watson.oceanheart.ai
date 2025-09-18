import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface StepProps {
  onNext: () => void;
  onBack: () => void;
  data?: any;
  updateData?: (data: any) => void;
}

export interface FormStep {
  id: string;
  title: string;
  component: React.ComponentType<StepProps>;
  validation?: (data: any) => boolean | string;
}

interface MultiStepFormProps {
  steps: FormStep[];
  onComplete: (data: any) => void;
  initialData?: any;
  className?: string;
}

export function MultiStepForm({
  steps,
  onComplete,
  initialData = {},
  className,
}: MultiStepFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const progress = ((currentStep + 1) / steps.length) * 100;

  const updateData = (stepData: any) => {
    const currentStepInfo = steps[currentStep];
    if (!currentStepInfo) return;
    setFormData((prev: any) => ({
      ...prev,
      [currentStepInfo.id]: stepData,
    }));
  };

  const handleNext = () => {
    const step = steps[currentStep];
    if (!step) return;
    
    const currentStepData = formData[step.id];
    
    // Validate current step if validation function exists
    if (step.validation) {
      const validationResult = step.validation(currentStepData);
      if (validationResult !== true) {
        setErrors({
          ...errors,
          [step.id]: typeof validationResult === 'string' ? validationResult : 'Please complete this step',
        });
        return;
      }
    }

    // Clear error for this step
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[step.id];
      return newErrors;
    });

    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      onComplete(formData);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const currentStepInfo = steps[currentStep];
  if (!currentStepInfo) return null;
  
  const CurrentStepComponent = currentStepInfo.component;
  const stepError = errors[currentStepInfo.id];

  return (
    <div className={cn("max-w-2xl mx-auto", className)}>
      {/* Progress bar */}
      <div className="mb-8">
        <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-zinc-600 transition-all duration-500"
            animate={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-2">
          {steps.map((step, idx) => (
            <span
              key={idx}
              className={cn(
                "text-xs",
                idx <= currentStep ? "text-zinc-400" : "text-zinc-600"
              )}
            >
              {step.title}
            </span>
          ))}
        </div>
      </div>

      {/* Step content with animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="glass-card p-6"
        >
          <h2 className="text-lg font-semibold text-zinc-50 mb-4">
            {currentStepInfo.title}
          </h2>
          
          {stepError && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-md">
              <p className="text-sm text-red-400">{stepError}</p>
            </div>
          )}

          <CurrentStepComponent
            onNext={handleNext}
            onBack={handleBack}
            data={formData[currentStepInfo.id]}
            updateData={updateData}
          />
        </motion.div>
      </AnimatePresence>

      {/* Navigation buttons */}
      <div className="flex justify-between mt-6">
        <button
          onClick={handleBack}
          disabled={currentStep === 0}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-md",
            "text-zinc-400 transition-all duration-200",
            currentStep === 0
              ? "opacity-50 cursor-not-allowed"
              : "hover:text-zinc-300 hover:bg-zinc-800/50"
          )}
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>

        <button
          onClick={handleNext}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-zinc-100 rounded-md hover:bg-zinc-700 transition-all duration-200"
        >
          {currentStep === steps.length - 1 ? "Complete" : "Next"}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Example step components for demonstration
export const ExampleStep1: React.FC<StepProps> = ({ data, updateData }) => {
  const [name, setName] = useState(data?.name || '');
  const [email, setEmail] = useState(data?.email || '');

  React.useEffect(() => {
    updateData?.({ name, email });
  }, [name, email, updateData]);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-zinc-400 mb-2">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-3 bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-600"
          placeholder="Enter your name"
        />
      </div>
      <div>
        <label className="block text-sm text-zinc-400 mb-2">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-600"
          placeholder="Enter your email"
        />
      </div>
    </div>
  );
};

export const ExampleStep2: React.FC<StepProps> = ({ data, updateData }) => {
  const [preference, setPreference] = useState(data?.preference || '');

  React.useEffect(() => {
    updateData?.({ preference });
  }, [preference, updateData]);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-zinc-400 mb-2">Preference</label>
        <select
          value={preference}
          onChange={(e) => setPreference(e.target.value)}
          className="w-full p-3 bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-600"
        >
          <option value="">Select a preference</option>
          <option value="option1">Option 1</option>
          <option value="option2">Option 2</option>
          <option value="option3">Option 3</option>
        </select>
      </div>
    </div>
  );
};