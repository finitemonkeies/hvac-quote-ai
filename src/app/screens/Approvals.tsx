import { AlertTriangle, ChevronRight, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { StepHeader } from "../components/StepHeader";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useAuth } from "../lib/auth";
import { formatCurrency, formatRelativeDate } from "../lib/format";
import { useEstimate } from "../lib/estimate-store";

export function Approvals() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { loadEstimate, recentEstimates } = useEstimate();

  const pending = recentEstimates.filter((record) => record.approvalStatus === "pending");
  const approved = recentEstimates.filter((record) => record.approvalStatus === "approved");

  return (
    <AppShell>
      <StepHeader title="Approval Queue" subtitle="Manager review" backTo="/" />

      <div className="mx-auto max-w-[760px] space-y-5">
        <Card className="rounded-[24px] border-slate-200 bg-white p-5 shadow-none">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-amber-50 p-3 text-amber-700">
              <AlertTriangle className="size-5" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-slate-950">Quotes needing review</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Pending approvals appear here when a selected option falls below policy. Managers can open the quote,
                review the context, and approve it from the proposal preview.
              </p>
              <p className="mt-3 text-sm font-medium text-slate-950">
                Current role: {profile?.role === "manager" ? "Manager" : "Sales rep"}
              </p>
            </div>
          </div>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="rounded-[20px] border-amber-200 bg-amber-50 p-5 shadow-none">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-amber-700">Pending</p>
            <p className="mt-2 text-3xl font-semibold text-amber-950">{pending.length}</p>
          </Card>
          <Card className="rounded-[20px] border-emerald-200 bg-emerald-50 p-5 shadow-none">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-emerald-700">Approved</p>
            <p className="mt-2 text-3xl font-semibold text-emerald-950">{approved.length}</p>
          </Card>
        </div>

        {pending.length === 0 ? (
          <Card className="rounded-[24px] border-slate-200 bg-white p-5 text-center shadow-none">
            <ShieldCheck className="mx-auto size-8 text-emerald-600" />
            <p className="mt-3 font-semibold text-slate-950">No pending approvals</p>
            <p className="mt-1 text-sm text-slate-600">Quotes that need manager review will show up here.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {pending.map((record) => {
              const selected =
                record.options.find((option) => option.id === record.selectedOptionId) ??
                record.options[1] ??
                record.options[0];

              return (
                <button
                  key={record.id}
                  type="button"
                  className="w-full text-left"
                  onClick={() => {
                    loadEstimate(record);
                    navigate("/preview");
                  }}
                >
                  <Card className="rounded-[22px] border-amber-200 bg-white p-5 shadow-none transition-colors hover:border-amber-300">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-lg font-semibold text-slate-950">{record.draft.customerName || "Customer"}</p>
                        <p className="mt-1 text-sm text-slate-600">
                          {record.draft.jobType} • {record.draft.propertyAddress || "Project site"}
                        </p>
                        <p className="mt-2 text-sm text-amber-800">
                          {selected?.policyReason || "Selected option needs review"}
                        </p>
                        <p className="mt-2 text-xs text-slate-500">{formatRelativeDate(record.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-lg font-semibold text-slate-950">
                            {formatCurrency(selected?.estimatedPrice ?? 0)}
                          </p>
                          <p className="text-xs text-slate-500">{selected?.title || "Option"}</p>
                        </div>
                        <ChevronRight className="size-5 text-slate-400" />
                      </div>
                    </div>
                  </Card>
                </button>
              );
            })}
          </div>
        )}

        {approved.length > 0 ? (
          <Card className="rounded-[24px] border-slate-200 bg-white p-5 shadow-none">
            <p className="text-sm font-semibold text-slate-950">Recently approved</p>
            <div className="mt-3 space-y-2">
              {approved.slice(0, 3).map((record) => (
                <div key={record.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-slate-700">
                    {record.draft.customerName || "Customer"} • {record.draft.jobType}
                  </span>
                  <span className="text-slate-500">{formatRelativeDate(record.createdAt)}</span>
                </div>
              ))}
            </div>
          </Card>
        ) : null}

        <Button variant="ghost" className="h-12 w-full rounded-full text-slate-700" onClick={() => navigate("/")}>
          Back Home
        </Button>
      </div>
    </AppShell>
  );
}
