"use client";

import { useRef, useState } from "react";
import apiClient from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Download, FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

export function BulkImportDialog({
  onImported,
}: {
  onImported?: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function reset() {
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleOpenChange(nextOpen: boolean) {
    if (isUploading) return;
    setOpen(nextOpen);
    if (!nextOpen) reset();
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;
    if (selected && !selected.name.toLowerCase().endsWith(".xlsx")) {
      toast.error("Select an Excel .xlsx workbook.");
      reset();
      return;
    }
    setFile(selected);
  }

  async function handleUpload() {
    if (!file) {
      toast.error("Select an Excel workbook first.");
      return;
    }

    setIsUploading(true);
    try {
      await apiClient.bulkImportExcel(file);
      await onImported?.();
      toast.success("Departments, designations, and users imported successfully.");
      setOpen(false);
      reset();
    } catch {
      toast.error("Could not import the workbook. Check the sheet names and column values.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <FileSpreadsheet className="h-4 w-4" /> Bulk import Excel
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Bulk import from Excel</DialogTitle>
            <DialogDescription>
              Import departments, designations, and users together from one .xlsx workbook.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/40 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-medium">Required workbook sheets</p>
                <Button variant="outline" size="sm" asChild>
                  <a href="/employee-bulk-import-template.xlsx" download>
                    <Download className="h-4 w-4" /> Download template
                  </a>
                </Button>
              </div>
              <div className="mt-3 space-y-3 text-xs text-muted-foreground">
                <div>
                  <p className="font-medium text-foreground">Departments</p>
                  <p>DepartmentName · Description</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">Designations</p>
                  <p>DesignationName</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">Users</p>
                  <p className="leading-relaxed">
                    EmployeeNo · FirstName · LastName · Email · Password · RoleName ·
                    DepartmentName · DesignationName · ReportsToEmployeeNo · IsActive
                  </p>
                </div>
              </div>
            </div>

            <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border px-6 py-8 text-center transition-colors hover:border-primary/50 hover:bg-muted/40">
              <FileSpreadsheet className="mb-3 h-9 w-9 text-primary" />
              <span className="text-sm font-medium">
                {file ? file.name : "Choose an Excel workbook"}
              </span>
              <span className="mt-1 text-xs text-muted-foreground">
                {file
                  ? `${(file.size / 1024).toFixed(1)} KB`
                  : "Only .xlsx files are supported"}
              </span>
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={handleFileChange}
                className="sr-only"
                disabled={isUploading}
              />
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isUploading}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={!file || isUploading}>
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {isUploading ? "Importing…" : "Import workbook"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
