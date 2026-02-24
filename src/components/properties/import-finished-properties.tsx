'use client';

import { useState } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ImportFinishedProperties() {
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    // Backend endpoint your friend will implement
    const formData = new FormData();
    formData.append('file', file);

    await fetch('/api/import-finished-properties', {
      method: 'POST',
      body: formData,
    });

    alert('File uploaded successfully');
  };

  return (
    <div>
      <input
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileChange}
        className="hidden"
        id="finishedImport"
      />

      <label htmlFor="finishedImport">
        <Button variant="outline" asChild>
          <span>
            <Upload className="mr-2 h-4 w-4" />
            Import Excel
          </span>
        </Button>
      </label>

      {file && (
  <>
    <Button
      size="sm"
      className="ml-2"
      onClick={handleUpload}
    >
      Upload
    </Button>

    <div className="text-sm text-muted-foreground mt-4">
      <p className="font-semibold">Supported Excel Format:</p>
      <ul className="list-disc ml-5">
        <li>Property Name</li>
        <li>Location</li>
        <li>Status (Occupied/Vacant)</li>
        <li>Monthly Rent</li>
        <li>Construction Cost</li>
        <li>Owner Name</li>
      </ul>
    </div>
  </>
)}
    </div>
  );
}