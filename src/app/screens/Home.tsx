import { ChevronRight, Clock3, Plus, Settings, ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { useAuth } from "../lib/auth";
import { formatCurrency, formatRelativeDate } from "../lib/format";
import { useEstimate } from "../lib/estimate-store";

export function Home() {
  const navigate = useNavigate();
  const { profile, signOut, user } = useAuth();
  const { recentEstimates, loadEstimate, startNewEstimate, isLoadingRecent } = useEstimate();
  const pendingApprovals = recentEstimates.filter((record) => record.approvalStatus === "pending");

  return (
    <AppShell>
      <div className="-mx-4 border-b border-slate-200 bg-white px-4 py-8 sm:-mx-6 sm:px-6">
        <div className="mx-auto max-w-[476px]">
          <h1 className="text-[2rem] font-semibold tracking-tight text-slate-950">HVAC Quote AI</h1>
          <p className="mt-2 text-[1.05rem] text-slate-600">Fast. Professional. On-site.</p>
          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-sm text-slate-500">{user?.email}</p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="h-9 rounded-lg border-slate-200 px-4 text-sm"
                onClick={() => navigate("/settings")}
              >
                <Settings className="size-4" />
                Company Profile
              </Button>
              <Button
                variant="outline"
                className="h-9 rounded-lg border-slate-200 px-4 text-sm"
                onClick={async () => {
                  await signOut();
                  navigate("/auth");
                }}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[476px] py-8">
        <Button
          className="h-16 w-full rounded-xl bg-[#2f66f5] text-base font-semibold text-white shadow-[0_14px_24px_-16px_rgba(47,102,245,0.9)] hover:bg-[#2458df]"
          onClick={() => {
            startNewEstimate();
            navigate("/job-setup");
          }}
        >
          <Plus className="size-5" />
          New Estimate
        </Button>

        {profile?.role === "manager" ? (
          <button type="button" className="mt-4 w-full text-left" onClick={() => navigate("/approvals")}>
            <Card className="rounded-[18px] border-amber-200 bg-amber-50 p-4 shadow-none transition-colors hover:border-amber-300">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-white p-2 text-amber-700">
                    <ShieldAlert className="size-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-950">Approval Queue</p>
                    <p className="text-sm text-slate-600">
                      {pendingApprovals.length > 0
                        ? `${pendingApprovals.length} quote(s) waiting for manager review`
                        : "No quotes currently waiting for approval"}
                    </p>
                  </div>
                </div>
                <ChevronRight className="size-5 text-slate-400" />
              </div>
            </Card>
          </button>
        ) : null}

        <div className="mt-12">
          <div className="mb-5 flex items-center gap-3">
            <Clock3 className="size-5 text-slate-400" />
            <h2 className="text-[1.15rem] font-semibold text-slate-950">Recent Estimates</h2>
          </div>

          {isLoadingRecent ? (
            <Card className="rounded-[18px] border-slate-200 bg-white p-5 shadow-none">
              <p className="text-sm text-slate-600">Loading your saved estimates...</p>
            </Card>
          ) : recentEstimates.length === 0 ? (
            <Card className="rounded-[18px] border-dashed border-slate-300 bg-white p-5 shadow-none">
              <p className="text-sm text-slate-600">No recent estimates yet.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {recentEstimates.map((record) => {
                const highlighted =
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
                      navigate("/options");
                    }}
                  >
                    <Card className="rounded-[18px] border-slate-200 bg-white p-4 shadow-none transition-colors hover:border-slate-300">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-[1.05rem] font-semibold text-slate-950">
                              {record.draft.jobType}
                            </p>
                            <p className="text-sm text-slate-500">
                              {formatRelativeDate(record.createdAt)}
                            </p>
                          </div>
                          <p className="mt-1 text-[0.98rem] text-slate-600">
                            {record.draft.homeSize.toLocaleString()} sq ft &bull; {record.draft.systemType}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="text-[1.05rem] font-semibold text-slate-950">
                            {formatCurrency(highlighted?.estimatedPrice ?? 0)}
                          </p>
                          <ChevronRight className="size-5 text-slate-400" />
                        </div>
                      </div>
                    </Card>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
