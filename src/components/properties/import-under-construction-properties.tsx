'use client';

import { useState } from 'react';
import { Upload, FileSpreadsheet, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import * as XLSX from 'xlsx';
import { useFirestore, useUser } from '@/firebase';
import { collection, doc, setDoc, getDocs } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';

export function ImportUnderConstructionProperties() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const db = useFirestore();
  const { user } = useUser();

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['Property Name', 'Location', 'Construction Stage', 'Estimated Budget (ZMW)'],
      ['Grand Plaza Mall', 'Central Business District', 'Foundation', 5000000],
      ['Lakeview Estates', 'North Shore', 'Planning', 1500000],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'Under_Construction_Template.xlsx');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !db || !user) return;
    setIsUploading(true);
    
    try {
      // Fetch existing properties to prevent duplicates
      const existingSnapshot = await getDocs(collection(db, 'users', user.uid, 'under_construction_properties'));
      const existingNames = new Set(existingSnapshot.docs.map(d => d.data().name.toLowerCase().trim()));

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const json = XLSX.utils.sheet_to_json<any>(worksheet);

          let imported = 0;
          let skipped: string[] = [];

          for (const row of json) {
            const name = row['Property Name'];
            if (!name) continue;

            const cleanName = String(name).trim();

            if (existingNames.has(cleanName.toLowerCase())) {
              skipped.push(cleanName);
              continue;
            }

            const validStages = ['Planning', 'Foundation', 'Framing', 'Roofing', 'Finishing', 'Completed'];
            let stage = row['Construction Stage'];
            if (!validStages.includes(stage)) stage = 'Planning';

            // Build property
            const propertyData = {
              name: cleanName,
              location: row['Location'] || 'Unknown',
              constructionStage: stage,
              estimatedBudget: Number(row['Estimated Budget (ZMW)']) || 0,
              type: 'Under Construction',
              createdAt: new Date().toISOString(),
              isDeleted: false,
              totalConstructionCost: 0,
              remainingInvestment: Number(row['Estimated Budget (ZMW)']) || 0,
              categoryId: 'default',
              code: `UCONST-${Date.now()}-${Math.floor(Math.random() * 1000)}`
            };

            const docRef = doc(collection(db, 'users', user.uid, 'under_construction_properties'));
            await setDoc(docRef, { ...propertyData, id: docRef.id });
            imported++;
          }

          if (skipped.length > 0) {
            toast({ 
              title: `Imported ${imported}. Skipped ${skipped.length}`, 
              description: `Skipped duplicates: ${skipped.join(', ')}`,
              duration: 10000 
            });
          } else {
            toast({ title: 'Import Successful', description: `Successfully imported ${imported} properties.` });
          }
          
          setOpen(false);
          setFile(null);
        } catch (err) {
          console.error(err);
          toast({ variant: 'destructive', title: 'Error', description: 'Failed to process Excel file.' });
        } finally {
          setIsUploading(false);
        }
      };
      
      reader.readAsArrayBuffer(file);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Network Error', description: 'Failed to check database.' });
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="shadow-sm">
          <Upload className="mr-2 h-4 w-4" />
          Import Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-orange-600" />
            Import Active Projects
          </DialogTitle>
          <DialogDescription>
            Download the construction template, input your projects, and import them.<br/>
            <strong>Note:</strong> Properties matching an existing name will be skipped.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-6 py-4">
          <div className="bg-slate-50 dark:bg-slate-900 border border-border p-4 rounded-xl flex items-center justify-between">
            <div className="text-sm">
              <p className="font-semibold text-foreground">Step 1: Get the format</p>
              <p className="text-muted-foreground">Download the required Excel template.</p>
            </div>
            <Button variant="secondary" size="sm" onClick={handleDownloadTemplate}>
              <Download className="mr-2 h-4 w-4" />
              Template
            </Button>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 border border-border p-4 rounded-xl flex flex-col gap-3">
            <div className="text-sm">
              <p className="font-semibold text-foreground">Step 2: Upload your data</p>
              <p className="text-muted-foreground">Upload the completed `.xlsx` file here.</p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
                id="underConstructionImportModal"
              />
              <label htmlFor="underConstructionImportModal" className="w-full">
                <div className="border-2 border-dashed border-border hover:border-primary transition-colors cursor-pointer rounded-lg p-6 flex flex-col items-center justify-center text-center">
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  {file ? (
                    <span className="text-sm font-medium text-primary">{file.name}</span>
                  ) : (
                    <span className="text-sm text-muted-foreground">Click to browse or drop file</span>
                  )}
                </div>
              </label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleUpload} disabled={!file || isUploading}>
            {isUploading ? 'Importing...' : 'Start Import'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}