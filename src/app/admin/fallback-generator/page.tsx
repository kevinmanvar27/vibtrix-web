'use client';

import { FallbackVideoGenerator } from '@/components/ui/FallbackVideoGenerator';

export default function FallbackGeneratorPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Fallback Video Generator</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <FallbackVideoGenerator />
      </div>
    </div>
  );
}
