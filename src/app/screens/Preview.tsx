import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { StepHeader } from "../components/StepHeader";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useAuth } from "../lib/auth";
import { calculateMonthlyPayment, formatCurrency } from "../lib/format";
import { useEstimate } from "../lib/estimate-store";

export function Preview() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const {
    approvalNote,
    approvalStatus,
    draft,
    options,
    pricingRules,
    proposal,
    selectedOptionId,
    selectOption,
    updateApproval,
    updateProposal,
  } = useEstimate();
  const selected =
    options.find((option) => option.id === selectedOptionId) ?? options[1] ?? options[0] ?? null;
  const estimatedMonthly =
    draft.financingEnabled && selected
      ? Math.round(
          calculateMonthlyPayment(
            selected.estimatedPrice,
            pricingRules.defaultFinancingApr,
            Math.max(draft.financingTermMonths, 1),
          ),
        )
      : null;

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
          {draft.customerPhone || draft.customerEmail ? (
            <p className="mt-2 text-sm text-slate-600">
              {draft.customerPhone || "No phone provided"}
              {draft.customerPhone && draft.customerEmail ? " - " : ""}
              {draft.customerEmail || ""}
            </p>
          ) : null}
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
          <div className="flex justify-between gap-3">
            <span>Existing system</span>
            <span className="font-medium text-right text-slate-950">
              {draft.existingSystemType}
              {draft.existingSystemAge ? `, ${draft.existingSystemAge}` : ""}
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span>Fuel / condition</span>
            <span className="font-medium text-right text-slate-950">
              {draft.existingFuelType} • {draft.existingSystemCondition}
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span>Access / location</span>
            <span className="font-medium text-right text-slate-950">
              {draft.accessDifficulty} • {draft.installLocation}
            </span>
          </div>
          {draft.comfortIssues ? (
            <div className="flex justify-between gap-3">
              <span>Comfort notes</span>
              <span className="max-w-[60%] text-right font-medium text-slate-950">
                {draft.comfortIssues}
              </span>
            </div>
          ) : null}
          <div className="flex justify-between gap-3">
            <span>Package / brand</span>
            <span className="font-medium text-right text-slate-950">
              {draft.equipmentPackage} • {draft.preferredBrand}
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span>Target margin</span>
            <span className="font-medium text-right text-slate-950">
              {Math.max(draft.targetGrossMargin, pricingRules.marginFloorPercent)}%
            </span>
          </div>
        </div>

        <div className="grid gap-3 border-b border-slate-200 py-5 text-sm text-slate-700 sm:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Upsells Included</p>
            <p className="mt-2 font-medium text-slate-950">
              {[
                draft.thermostatUpgrade && "Thermostat",
                draft.iaqBundle && "IAQ",
                draft.surgeProtection && "Surge",
                draft.maintenancePlan && "Maintenance",
                draft.extendedLaborWarranty && "Warranty",
              ]
                .filter(Boolean)
                .join(" • ") || "None selected"}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Financing</p>
            <p className="mt-2 font-medium text-slate-950">
              {draft.financingEnabled
                ? `Approx. ${formatCurrency(estimatedMonthly ?? 0)}/mo at ${pricingRules.defaultFinancingApr}% APR for ${draft.financingTermMonths} months`
                : "Financing hidden for this proposal"}
            </p>
          </div>
        </div>

        {selected?.policyStatus === "needs-approval" ? (
          <div className="border-b border-slate-200 py-5">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-950">Selected option needs approval</p>
              <p className="mt-1 text-sm text-amber-800">{selected.policyReason}</p>
              <div className="mt-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-950">Manager approval received</p>
                  <p className="text-xs text-slate-600">
                    {canApprove
                      ? "Mark approved if you already have a sign-off offline."
                      : "Only managers can mark this quote approved."}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={approvalStatus === "approved"}
                  onChange={(event) =>
                    updateApproval({ status: event.target.checked ? "approved" : "pending" })
                  }
                  className="size-4"
                  disabled={!canApprove}
                />
              </div>
              <div className="mt-4">
                <Label htmlFor="approvalNote">Approval note</Label>
                <Input
                  id="approvalNote"
                  value={approvalNote}
                  onChange={(event) => updateApproval({ note: event.target.value })}
                  className="mt-2 h-12 rounded-2xl border-amber-200 bg-white"
                  placeholder="Who approved it, or why pricing is below policy"
                />
              </div>
            </div>
          </div>
        ) : null}

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
  const canApprove = profile?.role === "manager";
