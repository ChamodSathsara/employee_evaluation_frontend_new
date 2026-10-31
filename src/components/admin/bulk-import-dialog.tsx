"use client";

import { useRef, useState } from "react";
import apiClient from "@/lib/apiClient";
import type { BulkImportSummary } from "@/types";
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

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export function BulkImportDialog({
  onImported,
}: {
  onImported?: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [successSummary, setSuccessSummary] = useState<BulkImportSummary | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function clearFile() {
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function reset() {
    clearFile();
    setSuccessSummary(null);
    setErrorMessage(null);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (isUploading) return;
    setOpen(nextOpen);
    if (!nextOpen) reset();
  }

  function rejectFile(message: string) {
    setErrorMessage(message);
    setSuccessSummary(null);
    clearFile();
    toast.error(message);
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;
    setErrorMessage(null);
    setSuccessSummary(null);

    if (!selected) {
      setFile(null);
      return;
    }
    if (!selected.name.toLowerCase().endsWith(".xlsx")) {
      rejectFile("Select an Excel .xlsx workbook.");
      return;
    }
    if (selected.size > MAX_FILE_SIZE) {
      rejectFile("The Excel workbook must be 10 MB or smaller.");
      return;
    }
    setFile(selected);
  }

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setErrorMessage("Select an Excel workbook first.");
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);
    setSuccessSummary(null);
    try {
      const response = await apiClient.bulkImportExcel(file);
      await onImported?.();
      setSuccessSummary(response.data);
      clearFile();
      toast.success(response.message ?? "Excel data imported successfully.");
    } catch (error) {
      const message = apiClient.getErrorMessage(error, "Could not import the workbook.");
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <FileSpreadsheet className="h-4 w-4" /> Employee Bulk Import
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Employee Bulk Import</DialogTitle>
            <DialogDescription>
              Bulk-create new employees from one Excel worksheet. Existing employees are not updated.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleUpload}>
            <div className="rounded-lg border border-border bg-muted/40 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium">Required sheet: Employee Import</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Companies, departments, and designations are created automatically when needed.
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href="/employee-bulk-import-template.xlsx" download>
                    <Download className="h-4 w-4" /> Download template
                  </a>
                </Button>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                EmployeeNo · FirstName · LastName · Email · Password · RoleName · CompanyName ·
                DepartmentName · DesignationName · ReportedSupervisorEmployeeNo ·
                ReportedHodEmployeeNo · IsActive
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                IsActive accepts 1/0 or TRUE/FALSE. CEO reporting fields may be blank.
              </p>
            </div>

            <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border px-6 py-8 text-center transition-colors hover:border-primary/50 hover:bg-muted/40">
              <FileSpreadsheet className="mb-3 h-9 w-9 text-primary" />
              <span className="text-sm font-medium">
                {file ? file.name : "Choose an Excel workbook"}
              </span>
              <span className="mt-1 text-xs text-muted-foreground">
                {file
                  ? `${(file.size / 1024 / 1024).toFixed(2)} MB`
                  : "Only .xlsx files up to 10 MB are supported"}
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

            {errorMessage && (
              <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {errorMessage}
              </div>
            )}

            {successSummary && (
              <div aria-live="polite" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  Excel data imported successfully.
                </p>
                <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div><dt className="text-muted-foreground">Companies created</dt><dd className="font-semibold">{successSummary.companiesCreated}</dd></div>
                  <div><dt className="text-muted-foreground">Departments created</dt><dd className="font-semibold">{successSummary.departmentsCreated}</dd></div>
                  <div><dt className="text-muted-foreground">Designations created</dt><dd className="font-semibold">{successSummary.designationsCreated}</dd></div>
                  <div><dt className="text-muted-foreground">Users created</dt><dd className="font-semibold">{successSummary.usersCreated}</dd></div>
                </dl>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isUploading}>
                Close
              </Button>
              <Button type="submit" disabled={!file || isUploading}>
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {isUploading ? "Importing…" : "Import employees"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
