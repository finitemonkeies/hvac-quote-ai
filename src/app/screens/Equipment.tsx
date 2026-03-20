import { Bolt } from "lucide-react";
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
import { Switch } from "../components/ui/switch";
import { cn } from "../components/ui/utils";
import { useEstimate } from "../lib/estimate-store";

export function Equipment() {
  const navigate = useNavigate();
  const { draft, generateOptions, isGenerating, pricingRules, updateDraft } = useEstimate();

  const tiers = [
    { value: "budget", label: "Budget", note: "Value tier" },
    { value: "standard", label: "Standard", note: "Most popular" },
    { value: "premium", label: "Premium", note: "High efficiency" },
  ] as const;
  const upsellToggles = [
    { key: "thermostatUpgrade", label: "Smart thermostat upgrade" },
    { key: "iaqBundle", label: "Indoor air quality bundle" },
    { key: "surgeProtection", label: "Compressor / surge protection" },
    { key: "maintenancePlan", label: "Maintenance plan enrollment" },
    { key: "extendedLaborWarranty", label: "Extended labor warranty" },
  ] as const;
  const packageOptions = ["Matched system", "High-efficiency match", "Value replacement", "Premium comfort package"];
  const brandOptions = ["Open", "Carrier", "Trane", "Lennox", "Rheem", "Daikin"];
  const financingTerms = [36, 60, 84, 120];

  const isValid = draft.equipmentCost > 0 && draft.laborHours > 0 && draft.materials >= 0;

  return (
    <AppShell>
      <StepHeader title="Equipment & Pricing" subtitle="Step 2 of 3" backTo="/job-setup" />

      <div className="mx-auto max-w-[466px]">
        <div>
          <Label className="text-[0.98rem] text-slate-900">Select Equipment Tier</Label>
          <div className="mt-3 grid grid-cols-3 gap-3">
            {tiers.map((tier) => (
              <button
                key={tier.value}
                type="button"
                onClick={() => updateDraft({ tier: tier.value })}
                className={cn(
                  "rounded-2xl border bg-white px-3 py-5 text-center transition-colors",
                  draft.tier === tier.value
                    ? "border-[#2f66f5] shadow-[inset_0_0_0_1px_#2f66f5]"
                    : "border-slate-200 hover:border-slate-300",
                )}
              >
                <p className="text-[1.02rem] font-semibold text-slate-950">{tier.label}</p>
                <p className="mt-7 text-sm text-slate-600">{tier.note}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-7 rounded-2xl border border-[#b9d0ff] bg-[#eaf2ff] p-4 shadow-[0_8px_20px_-18px_rgba(47,102,245,0.8)]">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-xl bg-[#2f66f5] text-white">
                <Bolt className="size-5" />
              </div>
              <div>
                <p className="font-semibold text-slate-950">Auto-suggest equipment & pricing</p>
                <p className="text-sm text-slate-600">AI-powered recommendations</p>
              </div>
            </div>
            <Switch checked={draft.autoSuggest} onCheckedChange={(autoSuggest) => updateDraft({ autoSuggest })} />
          </div>
        </div>

        <div className="mt-5 space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-[0.98rem] text-slate-900">Equipment Package</Label>
              <Select
                value={draft.equipmentPackage}
                onValueChange={(equipmentPackage) => updateDraft({ equipmentPackage })}
              >
                <SelectTrigger className="h-14 rounded-xl border-slate-300 bg-white text-base text-slate-600 shadow-none">
                  <SelectValue placeholder="Select package" />
                </SelectTrigger>
                <SelectContent>
                  {packageOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[0.98rem] text-slate-900">Preferred Brand</Label>
              <Select
                value={draft.preferredBrand}
                onValueChange={(preferredBrand) => updateDraft({ preferredBrand })}
              >
                <SelectTrigger className="h-14 rounded-xl border-slate-300 bg-white text-base text-slate-600 shadow-none">
                  <SelectValue placeholder="Select brand" />
                </SelectTrigger>
                <SelectContent>
                  {brandOptions.map((brand) => (
                    <SelectItem key={brand} value={brand}>
                      {brand}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="equipmentCost" className="text-[0.98rem] text-slate-900">
              Equipment Cost *
            </Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
              <Input
                id="equipmentCost"
                type="number"
                value={draft.equipmentCost || ""}
                onChange={(event) => updateDraft({ equipmentCost: Number(event.target.value) || 0 })}
                className="h-14 rounded-xl border-slate-300 bg-white pl-8 text-base shadow-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="laborHours" className="text-[0.98rem] text-slate-900">
              Labor Hours *
            </Label>
            <div className="relative">
              <Input
                id="laborHours"
                type="number"
                value={draft.laborHours || ""}
                onChange={(event) => updateDraft({ laborHours: Number(event.target.value) || 0 })}
                className="h-14 rounded-xl border-slate-300 bg-white pr-20 text-base shadow-none"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                @ ${pricingRules.laborRatePerHour}/hr
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="materials" className="text-[0.98rem] text-slate-900">
              Materials *
            </Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
              <Input
                id="materials"
                type="number"
                value={draft.materials || ""}
                onChange={(event) => updateDraft({ materials: Number(event.target.value) || 0 })}
                className="h-14 rounded-xl border-slate-300 bg-white pl-8 text-base shadow-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetGrossMargin" className="text-[0.98rem] text-slate-900">
              Target Gross Margin %
            </Label>
            <div className="relative">
              <Input
                id="targetGrossMargin"
                type="number"
                min={0}
                max={80}
                value={draft.targetGrossMargin || ""}
                onChange={(event) =>
                  updateDraft({ targetGrossMargin: Math.max(0, Number(event.target.value) || 0) })
                }
                className="h-14 rounded-xl border-slate-300 bg-white pr-10 text-base shadow-none"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-500">%</span>
            </div>
          </div>
        </div>

        <div className="mt-7 rounded-[20px] border border-slate-200 bg-white p-5">
          <h2 className="text-[1.02rem] font-semibold text-slate-950">Upsells & Protection</h2>
          <div className="mt-4 space-y-4">
            {upsellToggles.map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 px-4 py-3">
                <div>
                  <p className="font-medium text-slate-950">{label}</p>
                </div>
                <Switch
                  checked={draft[key]}
                  onCheckedChange={(checked) => updateDraft({ [key]: checked })}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-7 rounded-[20px] border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-[1.02rem] font-semibold text-slate-950">Financing</h2>
              <p className="mt-1 text-sm text-slate-600">Show estimated monthly payment options in the proposal.</p>
            </div>
            <Switch
              checked={draft.financingEnabled}
              onCheckedChange={(financingEnabled) => updateDraft({ financingEnabled })}
            />
          </div>

          {draft.financingEnabled ? (
            <div className="mt-4 space-y-2">
              <Label className="text-[0.98rem] text-slate-900">Financing Term</Label>
              <Select
                value={String(draft.financingTermMonths)}
                onValueChange={(value) => updateDraft({ financingTermMonths: Number(value) })}
              >
                <SelectTrigger className="h-14 rounded-xl border-slate-300 bg-white text-base text-slate-600 shadow-none">
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  {financingTerms.map((term) => (
                    <SelectItem key={term} value={String(term)}>
                      {term} months
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                Monthly estimate uses a default APR of {pricingRules.defaultFinancingApr}%.
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <Button
        disabled={!isValid || isGenerating}
        className="mx-auto mt-8 flex h-14 w-full max-w-[466px] rounded-xl bg-[#2f66f5] text-base font-semibold text-white hover:bg-[#2458df] disabled:bg-slate-200"
        onClick={async () => {
          await generateOptions();
          navigate("/options");
        }}
      >
        {isGenerating ? "Generating Options..." : "Generate Options"}
      </Button>
    </AppShell>
  );
}
