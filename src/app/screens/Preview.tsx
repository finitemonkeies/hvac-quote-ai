import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { StepHeader } from "../components/StepHeader";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { formatCurrency } from "../lib/format";
import { useEstimate } from "../lib/estimate-store";

export function Preview() {
  const navigate = useNavigate();
  const { draft, options, proposal, selectedOptionId, selectOption, updateProposal } = useEstimate();

  useEffect(() => {
    if (options.length === 0) {
      navigate("/input");
    }
  }, [navigate, options.length]);

  return (
    <AppShell>
      <StepHeader title="Proposal Preview" subtitle="Step 5 of 5" backTo="/options" />

      <Card className="rounded-[28px] border-slate-200 bg-white/90 p-5">
        <div className="grid gap-4">
          <div>
            <Label htmlFor="companyName">Company name</Label>
            <Input
              id="companyName"
              value={proposal.companyName}
              onChange={(event) => updateProposal({ companyName: event.target.value })}
              className="mt-2 h-12 rounded-2xl border-slate-200 bg-slate-50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="companyPhone">Phone</Label>
              <Input
                id="companyPhone"
                value={proposal.companyPhone}
                onChange={(event) => updateProposal({ companyPhone: event.target.value })}
                className="mt-2 h-12 rounded-2xl border-slate-200 bg-slate-50"
              />
            </div>
            <div>
              <Label htmlFor="companyEmail">Email</Label>
              <Input
                id="companyEmail"
                value={proposal.companyEmail}
                onChange={(event) => updateProposal({ companyEmail: event.target.value })}
                className="mt-2 h-12 rounded-2xl border-slate-200 bg-slate-50"
              />
            </div>
          </div>
        </div>
      </Card>

      <Card className="mt-4 rounded-[32px] border-slate-200 bg-white p-6 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.45)]">
        <div className="border-b border-slate-200 pb-5">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{proposal.companyName}</h2>
          <p className="mt-2 text-sm text-slate-600">
            {proposal.companyPhone} - {proposal.companyEmail}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Prepared for {draft.customerName || "your customer"} at {draft.propertyAddress || "the project site"}.
          </p>
        </div>

        <div className="grid gap-3 border-b border-slate-200 py-5 text-sm text-slate-700">
          <div className="flex justify-between gap-3">
            <span>Job type</span>
            <span className="font-medium text-slate-950">{draft.jobType}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span>System type</span>
            <span className="font-medium text-slate-950">{draft.systemType}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span>Install scope</span>
            <span className="font-medium text-slate-950">{draft.projectScope}</span>
          </div>
        </div>

        <div className="space-y-4 pt-5">
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`w-full rounded-[24px] border p-4 text-left transition-colors ${
                selectedOptionId === option.id
                  ? "border-teal-500 bg-teal-50"
                  : "border-slate-200 bg-slate-50/70"
              }`}
              onClick={() => selectOption(option.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-950">{option.title}</h3>
                    {option.isRecommended ? (
                      <span className="rounded-full bg-white px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-700">
                        Highlighted
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm font-medium text-slate-700">{option.systemName}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{option.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-semibold text-slate-950">{formatCurrency(option.estimatedPrice)}</p>
                  <p className="text-xs text-slate-500">
                    {formatCurrency(option.priceRangeLow)} - {formatCurrency(option.priceRangeHigh)}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </Card>

      <div className="mt-6 flex gap-3">
        <Button
          variant="outline"
          className="h-12 flex-1 rounded-full border-slate-300"
          onClick={() => navigate("/options")}
        >
          Back
        </Button>
        <Button
          className="h-12 flex-1 rounded-full bg-slate-950 text-white hover:bg-slate-800"
          onClick={() => navigate("/send")}
        >
          Send / Export
        </Button>
      </div>
    </AppShell>
  );
}
