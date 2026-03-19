import { Check, PencilLine } from "lucide-react";
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
