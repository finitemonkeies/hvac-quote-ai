import { AlertTriangle, Check, PencilLine } from "lucide-react";
import type { QuoteOption } from "../types/estimate";
import { formatCurrency } from "../lib/format";
import { Button } from "./ui/button";
import { cn } from "./ui/utils";

interface OptionCardProps {
  option: QuoteOption;
  isSelected: boolean;
  onSelect: () => void;
  onRefine: () => void;
}

export function OptionCard({ option, isSelected, onSelect, onRefine }: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "relative w-full rounded-[18px] border bg-white p-5 text-left transition-all",
        option.isRecommended ? "border-[#2f66f5] shadow-[inset_0_0_0_1px_#2f66f5]" : "border-slate-200",
        isSelected ? "shadow-[0_10px_28px_-22px_rgba(15,23,42,0.45)]" : "",
      )}
    >
      {option.isRecommended ? (
        <div className="absolute right-0 top-0 rounded-bl-xl rounded-tr-[18px] bg-[#2f66f5] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-white">
          Recommended
        </div>
      ) : null}
      {option.policyStatus === "needs-approval" ? (
        <div className="absolute left-0 top-0 flex items-center gap-1 rounded-br-xl rounded-tl-[18px] bg-amber-500 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-slate-950">
          <AlertTriangle className="size-3" />
          Approval
        </div>
      ) : null}

      <h3 className={cn("text-[1.1rem] font-semibold", option.isRecommended ? "text-[#2f66f5]" : "text-slate-950")}>
        {option.title}
      </h3>
      <p className="mt-1 text-sm leading-6 text-slate-600">{option.description}</p>

      <div className="mt-5">
        <p className={cn("text-[2.3rem] font-semibold tracking-tight", option.isRecommended ? "text-[#2f66f5]" : "text-slate-950")}>
          {formatCurrency(option.estimatedPrice)}
        </p>
        <p className="text-xs text-slate-500">
          {formatCurrency(option.priceRangeLow)} - {formatCurrency(option.priceRangeHigh)}
        </p>
        <p className="mt-1 text-xs font-medium text-slate-500">{option.systemName}</p>
      </div>

      {option.recommendedVendor ? (
        <div className="mt-4 rounded-2xl border border-sky-100 bg-sky-50/70 px-3 py-3 text-xs text-slate-700">
          <div className="flex items-center justify-between gap-3">
            <span className="font-semibold text-slate-950">Best supplier path</span>
            <span className="rounded-full bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-700">
              {option.recommendedVendor.availability}
            </span>
          </div>
          <p className="mt-2 font-medium text-slate-950">{option.recommendedVendor.vendorName}</p>
          <p className="mt-1">{option.recommendedVendor.notes}</p>
          <div className="mt-2 flex justify-between gap-3">
            <span>Lead time</span>
            <span className="font-medium text-slate-950">{option.recommendedVendor.leadTimeDays} days</span>
          </div>
          <div className="mt-1 flex justify-between gap-3">
            <span>Vendor est.</span>
            <span className="font-medium text-slate-950">{formatCurrency(option.recommendedVendor.estimatedInstalledPrice)}</span>
          </div>
          {option.vendorComparisons.length > 1 ? (
            <p className="mt-2 text-slate-600">
              {option.vendorComparisons.length - 1} alternative supplier
              {option.vendorComparisons.length - 1 === 1 ? "" : "s"} priced for comparison.
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-4 rounded-2xl bg-slate-50 px-3 py-3 text-xs text-slate-600">
        <div className="flex justify-between gap-3">
          <span>Hard cost</span>
          <span className="font-medium text-slate-950">{formatCurrency(option.hardCost)}</span>
        </div>
        <div className="mt-1 flex justify-between gap-3">
          <span>Gross margin</span>
          <span className="font-medium text-slate-950">{option.grossMarginPercent}%</span>
        </div>
        {option.estimatedMonthlyPayment ? (
          <div className="mt-1 flex justify-between gap-3">
            <span>Monthly est.</span>
            <span className="font-medium text-slate-950">{formatCurrency(option.estimatedMonthlyPayment)}</span>
          </div>
        ) : null}
        {option.policyReason ? (
          <p className="mt-2 flex items-start gap-2 text-amber-700">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
            <span>{option.policyReason}</span>
          </p>
        ) : null}
      </div>

      <div className="mt-6 space-y-2.5">
        {option.features.map((feature) => (
          <div key={feature} className="flex items-start gap-2 text-sm text-slate-700">
            <Check className={cn("mt-0.5 size-4", option.isRecommended ? "text-[#2f66f5]" : "text-slate-700")} />
            <span>{feature}</span>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-center">
        <Button
          type="button"
          variant="ghost"
          className="h-9 text-xs text-slate-700 hover:bg-transparent hover:text-slate-950"
          onClick={(event) => {
            event.stopPropagation();
            onRefine();
          }}
        >
          <PencilLine className="size-4" />
          Customize
        </Button>
      </div>
    </button>
  );
}
