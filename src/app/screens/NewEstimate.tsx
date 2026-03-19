import { useNavigate } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { StepHeader } from "../components/StepHeader";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import { useEstimate } from "../lib/estimate-store";

const jobTypes = [
  "AC Installation",
  "Furnace Installation",
  "Heat Pump Installation",
  "Full HVAC System",
  "Mini-Split Installation",
  "System Replacement",
];

const systemTypes = ["Central AC", "Gas Furnace", "Electric Furnace", "Heat Pump", "Dual Fuel", "Mini-Split"];

export function NewEstimate() {
  const navigate = useNavigate();
  const { draft, updateDraft } = useEstimate();
  const isValid = draft.jobType.trim() && draft.systemType.trim() && draft.homeSize > 0;

  return (
    <AppShell>
      <StepHeader title="New Estimate" subtitle="Step 1 of 3" backTo="/" />

      <div className="mx-auto max-w-[466px] space-y-6">
        <div className="space-y-2">
          <Label className="text-[0.98rem] text-slate-900">Job Type *</Label>
          <Select value={draft.jobType} onValueChange={(jobType) => updateDraft({ jobType })}>
            <SelectTrigger className="h-14 rounded-xl border-slate-300 bg-white text-base text-slate-600 shadow-none">
              <SelectValue placeholder="Select job type" />
            </SelectTrigger>
            <SelectContent>
              {jobTypes.map((jobType) => (
                <SelectItem key={jobType} value={jobType}>
                  {jobType}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="homeSize" className="text-[0.98rem] text-slate-900">
            Home Size (sq ft) *
          </Label>
          <Input
            id="homeSize"
            type="number"
            placeholder="e.g., 2000"
            value={draft.homeSize || ""}
            onChange={(event) => updateDraft({ homeSize: Number(event.target.value) || 0 })}
            className="h-14 rounded-xl border-slate-300 bg-white text-base shadow-none"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[0.98rem] text-slate-900">System Type *</Label>
          <Select value={draft.systemType} onValueChange={(systemType) => updateDraft({ systemType })}>
            <SelectTrigger className="h-14 rounded-xl border-slate-300 bg-white text-base text-slate-600 shadow-none">
              <SelectValue placeholder="Select system type" />
            </SelectTrigger>
            <SelectContent>
              {systemTypes.map((systemType) => (
                <SelectItem key={systemType} value={systemType}>
                  {systemType}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes" className="text-[0.98rem] text-slate-900">
            Notes (optional)
          </Label>
          <Textarea
            id="notes"
            value={draft.notes}
            onChange={(event) => updateDraft({ notes: event.target.value })}
            placeholder="Add any special requirements or notes..."
            className="min-h-24 rounded-xl border-slate-300 bg-white text-base shadow-none"
          />
        </div>
      </div>

      <Button
        disabled={!isValid}
        className="mx-auto mt-8 flex h-14 w-full max-w-[466px] rounded-xl bg-[#2f66f5] text-base font-semibold text-white hover:bg-[#2458df] disabled:bg-slate-200"
        onClick={() => navigate("/input")}
      >
        Continue
      </Button>
    </AppShell>
  );
}
