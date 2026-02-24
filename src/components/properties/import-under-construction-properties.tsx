'use client';

import { useState } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ImportUnderConstructionProperties() {
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    await fetch('/api/import-under-construction-properties', {
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
        id="underConstructionImport"
      />

      <label htmlFor="underConstructionImport">
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
            <p className="font-semibold">
              Supported Excel Format:
            </p>
            <ul className="list-disc ml-5">
              <li>Property Name</li>
              <li>Location</li>
              <li>Expected Completion Date</li>
              <li>Budget Amount</li>
              <li>Current Amount Spent</li>
              <li>Owner Name</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}