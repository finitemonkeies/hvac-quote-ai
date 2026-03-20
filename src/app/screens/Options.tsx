import { ChevronDown, Sparkles } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { OptionCard } from "../components/OptionCard";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { formatCurrency } from "../lib/format";
import { useEstimate } from "../lib/estimate-store";

export function Options() {
  const navigate = useNavigate();
  const { draft, options, pricingRules, selectedOptionId, selectOption } = useEstimate();
  const better = options.find((option) => option.level === "better");
  const flaggedOptions = options.filter((option) => option.policyStatus === "needs-approval");
  const laborCost = draft.laborHours * pricingRules.laborRatePerHour;
  const baseTotal = draft.equipmentCost + laborCost + draft.materials;

  useEffect(() => {
    if (options.length === 0) {
      navigate("/input");
    }
  }, [navigate, options.length]);

  return (
    <AppShell>
      <div className="mx-auto max-w-[1180px] py-6">
        <Card className="rounded-[14px] border-slate-200 bg-white p-4 shadow-none">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-[1.55rem] font-semibold text-slate-950">{draft.jobType}</h1>
              <p className="mt-1 text-sm text-slate-600">
                {draft.homeSize.toLocaleString()} sq ft &bull; {draft.systemType}
              </p>
            </div>
            <Button
              variant="outline"
              className="h-9 rounded-lg border-slate-200 px-4 text-sm"
              onClick={() => navigate("/job-setup")}
            >
              Edit
            </Button>
          </div>
        </Card>

        <div className="mt-6 flex items-center gap-2">
          <Sparkles className="size-4 text-[#2f66f5]" />
          <h2 className="text-[1.15rem] font-semibold text-slate-950">Choose Your Option</h2>
        </div>

        {flaggedOptions.length > 0 ? (
          <Card className="mt-4 rounded-[18px] border-amber-200 bg-amber-50 p-4 shadow-none">
            <p className="text-sm font-semibold text-amber-950">Approval required on {flaggedOptions.length} option(s)</p>
            <p className="mt-1 text-sm text-amber-800">
              Quotes below the {pricingRules.marginFloorPercent}% margin floor or above the {pricingRules.maxDiscountPercent}% discount limit are flagged for approval.
            </p>
          </Card>
        ) : null}

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {options.map((option) => (
            <OptionCard
              key={option.id}
              option={option}
              isSelected={selectedOptionId === option.id}
              onSelect={() => selectOption(option.id)}
              onRefine={() => navigate(`/options/${option.id}/refine`)}
            />
          ))}
        </div>

        <p className="mt-4 text-center text-xs text-slate-500">
          Pricing based on typical market ranges. Adjust based on your local costs
        </p>

        <Card className="mt-6 rounded-[12px] border-slate-200 bg-white p-0 shadow-none">
          <div className="flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-900">
            <span>Cost Breakdown</span>
            <ChevronDown className="size-4 text-slate-400" aria-hidden="true" />
          </div>
          <div className="border-t border-slate-100 px-4 py-4 text-sm text-slate-600">
            <div className="flex justify-between">
              <span>Equipment ({draft.tier})</span>
              <span>{formatCurrency(draft.equipmentCost)}</span>
            </div>
            <div className="mt-2 flex justify-between">
              <span>Labor ({draft.laborHours} hrs @ ${pricingRules.laborRatePerHour}/hr)</span>
              <span>{formatCurrency(laborCost)}</span>
            </div>
            <div className="mt-2 flex justify-between">
              <span>Materials</span>
              <span>{formatCurrency(draft.materials)}</span>
            </div>
            <div className="mt-3 flex justify-between border-t border-slate-100 pt-3 font-medium text-slate-900">
              <span>Better baseline</span>
              <span>{formatCurrency(better?.estimatedPrice ?? baseTotal)}</span>
            </div>
          </div>
        </Card>

        <div className="mt-5 flex gap-3">
          <Button
            variant="outline"
            className="h-12 flex-1 rounded-lg border-slate-300 bg-white"
            onClick={() => navigate("/input")}
          >
            Adjust Pricing
          </Button>
          <Button
            className="h-12 flex-1 rounded-lg bg-[#2f66f5] text-white hover:bg-[#2458df]"
            onClick={() => navigate("/preview")}
          >
            Create Proposal
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
