import React, { useState } from 'react';
import { SkewedBackground } from '../components/SkewedBackground';
import { CompactCard } from '../components/CompactCard';
import { MonochromeButton } from '../components/MonochromeButton';
import { MonochromeInput } from '../components/MonochromeInput';
import { RadioGroup } from '../components/RadioGroup';
import { TextareaWithCount } from '../components/TextareaWithCount';
import { TabNav } from '../components/TabNav';
import { Toast } from '../components/Toast';
import { Breadcrumb } from '../components/Breadcrumb';
import { Skeleton, ContentSkeleton, CardSkeleton } from '../components/Skeleton';
import { DragDropZone } from '../components/DragDropZone';
import { CommandPalette, useCommandPalette, defaultCommands } from '../components/CommandPalette';
import { MultiStepForm, ExampleStep1, ExampleStep2 } from '../components/MultiStepForm';
import type { FormStep } from '../components/MultiStepForm';
import { Settings, Bell, Shield, Link, Activity, Users, DollarSign } from 'lucide-react';

export function MonochromeDemo() {
  // State for interactive components
  const [inputValue, setInputValue] = useState('');
  const [textareaValue, setTextareaValue] = useState('');
  const [radioValue, setRadioValue] = useState('option1');
  const [activeTab, setActiveTab] = useState('tab1');
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning' | 'info'>('info');
  const commandPalette = useCommandPalette();

  const radioOptions = [
    { value: 'option1', label: 'Standard Plan', description: 'Basic features for individuals' },
    { value: 'option2', label: 'Professional Plan', description: 'Advanced features for teams' },
    { value: 'option3', label: 'Enterprise Plan', description: 'Custom solutions for organizations' },
  ];

  const tabs = [
    { id: 'tab1', label: 'Overview', count: 12 },
    { id: 'tab2', label: 'Analytics', count: 5 },
    { id: 'tab3', label: 'Reports' },
    { id: 'tab4', label: 'Settings' },
  ];

  const breadcrumbItems = [
    { label: 'Home', href: '/', path: '/' },
    { label: 'Components', href: '/components', path: '/components' },
    { label: 'Monochrome Demo', path: '/components/monochrome' },
  ];

  const formSteps: FormStep[] = [
    {
      id: 'personal',
      title: 'Personal Information',
      component: ExampleStep1,
      validation: (data) => {
        if (!data?.name || !data?.email) {
          return 'Please fill in all required fields';
        }
        return true;
      },
    },
    {
      id: 'preferences',
      title: 'Preferences',
      component: ExampleStep2,
      validation: (data) => {
        if (!data?.preference) {
          return 'Please select a preference';
        }
        return true;
      },
    },
  ];

  const handleFileDrop = (files: File[]) => {
    console.log('Files dropped:', files);
    setToastType('success');
    setShowToast(true);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <SkewedBackground opacity={0.03} />
      
      <div className="relative z-10 max-w-6xl mx-auto p-8">
        <header className="mb-12">
          <h1 className="text-4xl font-bold text-zinc-50 mb-4">
            Monochrome Design System
          </h1>
          <p className="text-zinc-400">
            A sophisticated zinc-based design system with glass morphism effects
          </p>
        </header>

        {/* Breadcrumb */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-zinc-100 mb-6">Navigation</h2>
          <Breadcrumb items={breadcrumbItems} />
        </section>

        {/* Buttons */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-zinc-100 mb-6">Buttons</h2>
          <div className="flex flex-wrap gap-4">
            <MonochromeButton variant="primary">Primary Button</MonochromeButton>
            <MonochromeButton variant="ghost">Ghost Button</MonochromeButton>
            <MonochromeButton variant="icon">
              <Settings className="w-5 h-5" />
            </MonochromeButton>
            <MonochromeButton variant="primary" loading>
              Loading
            </MonochromeButton>
            <MonochromeButton variant="primary" disabled>
              Disabled
            </MonochromeButton>
          </div>
        </section>

        {/* Form Controls */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-zinc-100 mb-6">Form Controls</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Input with Icon</label>
              <MonochromeInput
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Search or enter text"
                icon={<Settings className="w-4 h-4" />}
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-2">Textarea with Character Count</label>
              <TextareaWithCount
                value={textareaValue}
                onChange={(e) => setTextareaValue(e.target.value)}
                placeholder="Enter your message here..."
                maxLength={200}
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-2">Radio Group</label>
              <RadioGroup
                options={radioOptions}
                value={radioValue}
                onChange={setRadioValue}
              />
            </div>
          </div>
        </section>

        {/* Tabs */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-zinc-100 mb-6">Tab Navigation</h2>
          <TabNav tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
          <div className="glass-card p-6 mt-4">
            <p className="text-zinc-300">Content for {activeTab}</p>
          </div>
        </section>

        {/* Cards */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-zinc-100 mb-6">Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <CompactCard
              title="Total Revenue"
              description="Monthly recurring revenue"
              icon={<DollarSign className="w-4 h-4" />}
              status="success"
            />
            <CompactCard
              title="Active Users"
              description="Currently online"
              icon={<Users className="w-4 h-4" />}
              status="warning"
            />
            <CompactCard
              title="System Health"
              description="All systems operational"
              icon={<Activity className="w-4 h-4" />}
              status="success"
            />
          </div>
        </section>

        {/* Skeleton Loading */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-zinc-100 mb-6">Loading States</h2>
          <div className="space-y-4">
            <ContentSkeleton />
            <CardSkeleton />
          </div>
        </section>

        {/* File Upload */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-zinc-100 mb-6">File Upload</h2>
          <DragDropZone
            onFileDrop={handleFileDrop}
            accept="image/*,.pdf"
            multiple
          />
        </section>

        {/* Multi-Step Form */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-zinc-100 mb-6">Multi-Step Form</h2>
          <MultiStepForm
            steps={formSteps}
            onComplete={(data) => {
              console.log('Form completed:', data);
              setToastType('success');
              setShowToast(true);
            }}
          />
        </section>

        {/* Toast Examples */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-zinc-100 mb-6">Toast Notifications</h2>
          <div className="flex flex-wrap gap-4">
            <MonochromeButton
              variant="primary"
              onClick={() => {
                setToastType('success');
                setShowToast(true);
              }}
            >
              Show Success Toast
            </MonochromeButton>
            <MonochromeButton
              variant="primary"
              onClick={() => {
                setToastType('error');
                setShowToast(true);
              }}
            >
              Show Error Toast
            </MonochromeButton>
            <MonochromeButton
              variant="primary"
              onClick={() => {
                setToastType('warning');
                setShowToast(true);
              }}
            >
              Show Warning Toast
            </MonochromeButton>
            <MonochromeButton
              variant="primary"
              onClick={() => {
                setToastType('info');
                setShowToast(true);
              }}
            >
              Show Info Toast
            </MonochromeButton>
          </div>
          {showToast && (
            <div className="fixed bottom-8 right-8 z-50">
              <Toast
                message={`This is a ${toastType} message`}
                type={toastType}
                onClose={() => setShowToast(false)}
              />
            </div>
          )}
        </section>

        {/* Command Palette */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-zinc-100 mb-6">Command Palette</h2>
          <MonochromeButton variant="primary" onClick={commandPalette.open}>
            Open Command Palette (⌘K)
          </MonochromeButton>
          <CommandPalette
            isOpen={commandPalette.isOpen}
            onClose={commandPalette.close}
            commands={defaultCommands}
          />
        </section>
      </div>
    </div>
  );
}