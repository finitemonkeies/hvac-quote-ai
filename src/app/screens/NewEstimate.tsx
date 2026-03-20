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
const fuelTypes = ["Electric", "Natural gas", "Propane", "Dual fuel", "Unknown"];
const systemConditions = [
  "Aging but operational",
  "Frequent breakdowns",
  "No cooling / no heating",
  "Poor airflow and comfort",
];
const installLocations = ["Ground level", "Attic", "Crawlspace", "Closet / mechanical room", "Roof"];
const accessOptions = ["Standard access", "Tight attic / crawl", "Multi-story carry", "Roof / crane concern"];

export function NewEstimate() {
  const navigate = useNavigate();
  const { draft, updateDraft } = useEstimate();
  const isValid =
    draft.customerName.trim() &&
    draft.propertyAddress.trim() &&
    draft.jobType.trim() &&
    draft.systemType.trim() &&
    draft.homeSize > 0;

  return (
    <AppShell>
      <StepHeader title="New Estimate" subtitle="Step 1 of 3" backTo="/" />

      <div className="mx-auto max-w-[466px] space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="customerName" className="text-[0.98rem] text-slate-900">
              Customer Name *
            </Label>
            <Input
              id="customerName"
              value={draft.customerName}
              onChange={(event) => updateDraft({ customerName: event.target.value })}
              placeholder="Homeowner name"
              className="h-14 rounded-xl border-slate-300 bg-white text-base shadow-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerPhone" className="text-[0.98rem] text-slate-900">
              Customer Phone
            </Label>
            <Input
              id="customerPhone"
              type="tel"
              value={draft.customerPhone}
              onChange={(event) => updateDraft({ customerPhone: event.target.value })}
              placeholder="(555) 555-5555"
              className="h-14 rounded-xl border-slate-300 bg-white text-base shadow-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerEmail" className="text-[0.98rem] text-slate-900">
              Customer Email
            </Label>
            <Input
              id="customerEmail"
              type="email"
              value={draft.customerEmail}
              onChange={(event) => updateDraft({ customerEmail: event.target.value })}
              placeholder="homeowner@email.com"
              className="h-14 rounded-xl border-slate-300 bg-white text-base shadow-none"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="propertyAddress" className="text-[0.98rem] text-slate-900">
            Property Address *
          </Label>
          <Input
            id="propertyAddress"
            value={draft.propertyAddress}
            onChange={(event) => updateDraft({ propertyAddress: event.target.value })}
            placeholder="123 Main St, Springfield"
            className="h-14 rounded-xl border-slate-300 bg-white text-base shadow-none"
          />
        </div>

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

        <div className="rounded-[20px] border border-slate-200 bg-white p-5">
          <h2 className="text-[1.02rem] font-semibold text-slate-950">Existing Equipment</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-[0.98rem] text-slate-900">Existing System Type</Label>
              <Select
                value={draft.existingSystemType}
                onValueChange={(existingSystemType) => updateDraft({ existingSystemType })}
              >
                <SelectTrigger className="h-14 rounded-xl border-slate-300 bg-white text-base text-slate-600 shadow-none">
                  <SelectValue placeholder="Select existing system" />
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
              <Label htmlFor="existingSystemAge" className="text-[0.98rem] text-slate-900">
                Approximate Age
              </Label>
              <Input
                id="existingSystemAge"
                value={draft.existingSystemAge}
                onChange={(event) => updateDraft({ existingSystemAge: event.target.value })}
                placeholder="e.g., 14 years"
                className="h-14 rounded-xl border-slate-300 bg-white text-base shadow-none"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[0.98rem] text-slate-900">Fuel Type</Label>
              <Select
                value={draft.existingFuelType}
                onValueChange={(existingFuelType) => updateDraft({ existingFuelType })}
              >
                <SelectTrigger className="h-14 rounded-xl border-slate-300 bg-white text-base text-slate-600 shadow-none">
                  <SelectValue placeholder="Select fuel type" />
                </SelectTrigger>
                <SelectContent>
                  {fuelTypes.map((fuelType) => (
                    <SelectItem key={fuelType} value={fuelType}>
                      {fuelType}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[0.98rem] text-slate-900">System Condition</Label>
              <Select
                value={draft.existingSystemCondition}
                onValueChange={(existingSystemCondition) => updateDraft({ existingSystemCondition })}
              >
                <SelectTrigger className="h-14 rounded-xl border-slate-300 bg-white text-base text-slate-600 shadow-none">
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  {systemConditions.map((condition) => (
                    <SelectItem key={condition} value={condition}>
                      {condition}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="rounded-[20px] border border-slate-200 bg-white p-5">
          <h2 className="text-[1.02rem] font-semibold text-slate-950">Install Complexity</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-[0.98rem] text-slate-900">Install Location</Label>
              <Select
                value={draft.installLocation}
                onValueChange={(installLocation) => updateDraft({ installLocation })}
              >
                <SelectTrigger className="h-14 rounded-xl border-slate-300 bg-white text-base text-slate-600 shadow-none">
                  <SelectValue placeholder="Select install location" />
                </SelectTrigger>
                <SelectContent>
                  {installLocations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[0.98rem] text-slate-900">Access Difficulty</Label>
              <Select
                value={draft.accessDifficulty}
                onValueChange={(accessDifficulty) => updateDraft({ accessDifficulty })}
              >
                <SelectTrigger className="h-14 rounded-xl border-slate-300 bg-white text-base text-slate-600 shadow-none">
                  <SelectValue placeholder="Select access difficulty" />
                </SelectTrigger>
                <SelectContent>
                  {accessOptions.map((access) => (
                    <SelectItem key={access} value={access}>
                      {access}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="comfortIssues" className="text-[0.98rem] text-slate-900">
                Comfort Issues / Field Notes
              </Label>
              <Textarea
                id="comfortIssues"
                value={draft.comfortIssues}
                onChange={(event) => updateDraft({ comfortIssues: event.target.value })}
                placeholder="Hot upstairs, noisy air handler, poor airflow in back rooms..."
                className="min-h-24 rounded-xl border-slate-300 bg-white text-base shadow-none"
              />
            </div>
          </div>
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
