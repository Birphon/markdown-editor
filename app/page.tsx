'use client';  // This enables client-side functionality in Next.js

import { TextEditor } from '@/components/TextEditor';

export default function Home() {
  return (
    <main className="min-h-screen p-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Markdown Editor</h1>
        <TextEditor />
      </div>
    </main>
  );
}