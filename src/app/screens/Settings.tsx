import { useEffect, useState } from "react";
import { Activity, Building2, Copy, PlugZap, Users } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "../components/AppShell";
import { StepHeader } from "../components/StepHeader";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { useAuth } from "../lib/auth";
import { useEstimate } from "../lib/estimate-store";
import {
  fetchQuoteOutcomeAnalytics,
  fetchQuoteObservabilitySummary,
  fetchVendorIntegrationsFromSupabase,
  fetchLatestVendorQuoteRequestSummary,
  generateQuoteOptionsViaSupabase,
  saveVendorIntegrationToSupabase,
  testVendorIntegrationViaSupabase,
  type QuoteOutcomeAnalyticsSummary,
  type QuoteObservabilitySummary,
} from "../services/supabase";
import type { VendorIntegration, VendorIntegrationTestResult } from "../types/estimate";

type SmokeTestResult = {
  optionCount: number;
  comparedVendorCount: number;
  recommendedVendors: string[];
  ranAt: string;
  latestRequestId: string;
  latestRequestCustomer: string;
  latestRequestItemCount: number;
};

export function Settings() {
  const { joinWorkspace, members, profile, refreshMembers, setRole, updateMemberRole, updateWorkspace } =
    useAuth();
  const { companyProfile, draft, pricingRules, updateCompanyProfile, updatePricingRules } = useEstimate();
  const [workspaceName, setWorkspaceName] = useState(profile?.organizationName ?? "");
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const [isJoiningWorkspace, setIsJoiningWorkspace] = useState(false);
  const [isRunningSmokeTest, setIsRunningSmokeTest] = useState(false);
  const [smokeTestResult, setSmokeTestResult] = useState<SmokeTestResult | null>(null);
  const [vendors, setVendors] = useState<VendorIntegration[]>([]);
  const [isLoadingVendors, setIsLoadingVendors] = useState(false);
  const [savingVendorId, setSavingVendorId] = useState<string | null>(null);
  const [testingVendorId, setTestingVendorId] = useState<string | null>(null);
  const [vendorTestResults, setVendorTestResults] = useState<Record<string, VendorIntegrationTestResult>>({});
  const [observabilitySummary, setObservabilitySummary] = useState<QuoteObservabilitySummary | null>(null);
  const [isLoadingObservability, setIsLoadingObservability] = useState(false);
  const [outcomeAnalytics, setOutcomeAnalytics] = useState<QuoteOutcomeAnalyticsSummary | null>(null);
  const [isLoadingOutcomeAnalytics, setIsLoadingOutcomeAnalytics] = useState(false);

  useEffect(() => {
    setWorkspaceName(profile?.organizationName ?? "");
  }, [profile?.organizationName]);

  useEffect(() => {
    if (profile?.role !== "manager") {
      setVendors([]);
      return;
    }

    let active = true;
    setIsLoadingVendors(true);

    fetchVendorIntegrationsFromSupabase()
      .then((nextVendors) => {
        if (active) {
          setVendors(nextVendors);
        }
      })
      .catch((error) => {
        toast.error(getErrorMessage(error, "Could not load vendor integrations."));
      })
      .finally(() => {
        if (active) {
          setIsLoadingVendors(false);
        }
      });

    return () => {
      active = false;
    };
  }, [profile?.role]);

  useEffect(() => {
    if (profile?.role !== "manager") {
      setObservabilitySummary(null);
      return;
    }

    let active = true;
    setIsLoadingObservability(true);

    fetchQuoteObservabilitySummary()
      .then((summary) => {
        if (active) {
          setObservabilitySummary(summary);
        }
      })
      .catch((error) => {
        toast.error(getErrorMessage(error, "Could not load quote observability."));
      })
      .finally(() => {
        if (active) {
          setIsLoadingObservability(false);
        }
      });

    return () => {
      active = false;
    };
  }, [profile?.organizationId, profile?.role]);

  useEffect(() => {
    if (profile?.role !== "manager") {
      setOutcomeAnalytics(null);
      return;
    }

    let active = true;
    setIsLoadingOutcomeAnalytics(true);

    fetchQuoteOutcomeAnalytics()
      .then((summary) => {
        if (active) {
          setOutcomeAnalytics(summary);
        }
      })
      .catch((error) => {
        toast.error(getErrorMessage(error, "Could not load outcome analytics."));
      })
      .finally(() => {
        if (active) {
          setIsLoadingOutcomeAnalytics(false);
        }
      });

    return () => {
      active = false;
    };
  }, [profile?.organizationId, profile?.role]);

  const getErrorMessage = (error: unknown, fallback: string) =>
    error instanceof Error ? error.message : fallback;

  const handleWorkspaceNameBlur = async () => {
    if (!workspaceName.trim() || workspaceName === profile?.organizationName) {
      return;
    }

    try {
      await updateWorkspace({ name: workspaceName.trim() });
      toast.success("Workspace updated.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not update workspace."));
    }
  };

  const handleCopyJoinCode = async () => {
    if (!profile?.organizationJoinCode) {
      return;
    }

    try {
      await navigator.clipboard.writeText(profile.organizationJoinCode);
      setCopyStatus("Join code copied.");
      toast.success("Join code copied.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not copy the join code."));
    }
  };

  const handleJoinWorkspace = async () => {
    const joinCode = joinCodeInput.trim();
    if (!joinCode) {
      return;
    }

    setIsJoiningWorkspace(true);

    try {
      await joinWorkspace(joinCode);
      setJoinCodeInput("");
      toast.success("Joined workspace.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not join that workspace."));
    } finally {
      setIsJoiningWorkspace(false);
    }
  };

  const handleRefreshMembers = async () => {
    try {
      await refreshMembers();
      toast.success("Workspace team refreshed.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not refresh workspace members."));
    }
  };

  const handleQuoteBackendSmokeTest = async () => {
    setIsRunningSmokeTest(true);

    try {
      const options = await generateQuoteOptionsViaSupabase({ draft, pricingRules });
      const comparedVendorCount = options.reduce((total, option) => total + option.vendorComparisons.length, 0);
      const recommendedVendors = options
        .map((option) => option.recommendedVendor?.vendorName)
        .filter(Boolean) as string[];
      const latestRequest = await fetchLatestVendorQuoteRequestSummary();

      if (!latestRequest) {
        throw new Error("Quote function returned options, but no vendor quote request log was found.");
      }

      setSmokeTestResult({
        optionCount: options.length,
        comparedVendorCount,
        recommendedVendors,
        ranAt: new Date().toLocaleString(),
        latestRequestId: latestRequest.id,
        latestRequestCustomer: latestRequest.customerName || "No customer name",
        latestRequestItemCount: latestRequest.itemCount,
      });
      const summary = await fetchQuoteObservabilitySummary();
      setObservabilitySummary(summary);
      const analytics = await fetchQuoteOutcomeAnalytics();
      setOutcomeAnalytics(analytics);
      toast.success("Quote backend smoke test and logging check passed.");
    } catch (error) {
      setSmokeTestResult(null);
      toast.error(getErrorMessage(error, "Quote backend smoke test failed."));
    } finally {
      setIsRunningSmokeTest(false);
    }
  };

  const handleVendorChange = (vendorId: string, updates: Partial<VendorIntegration>) => {
    setVendors((current) =>
      current.map((vendor) => (vendor.id === vendorId ? { ...vendor, ...updates } : vendor)),
    );
  };

  const handleVendorSystemTypesChange = (vendorId: string, value: string) => {
    handleVendorChange(vendorId, {
      supportedSystemTypes: value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    });
  };

  const handleVendorSave = async (vendor: VendorIntegration) => {
    setSavingVendorId(vendor.id);

    try {
      await saveVendorIntegrationToSupabase(vendor);
      const refreshed = await fetchVendorIntegrationsFromSupabase();
      setVendors(refreshed);
      toast.success(`${vendor.name} integration saved.`);
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not save vendor integration."));
    } finally {
      setSavingVendorId(null);
    }
  };

  const handleVendorTest = async (vendor: VendorIntegration) => {
    setTestingVendorId(vendor.id);

    try {
      const result = await testVendorIntegrationViaSupabase({
        vendorId: vendor.id,
        draft,
        pricingRules,
      });
      setVendorTestResults((current) => ({ ...current, [vendor.id]: result }));
      const refreshed = await fetchVendorIntegrationsFromSupabase();
      setVendors(refreshed);
      const summary = await fetchQuoteObservabilitySummary();
      setObservabilitySummary(summary);
      const analytics = await fetchQuoteOutcomeAnalytics();
      setOutcomeAnalytics(analytics);
      toast.success(`${vendor.name} test completed.`);
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not test vendor integration."));
    } finally {
      setTestingVendorId(null);
    }
  };

  return (
    <AppShell>
      <StepHeader title="Company Profile" subtitle="Proposal defaults" backTo="/" />

      <div className="mx-auto max-w-[560px] space-y-5">
        <Card className="rounded-[24px] border-slate-200 bg-white p-5 shadow-none">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-[#eaf2ff] p-3 text-[#2f66f5]">
              <Building2 className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Set your proposal defaults</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                These details now carry into each new estimate so techs can move faster in the field.
              </p>
            </div>
          </div>
        </Card>

        <Card className="rounded-[24px] border-slate-200 bg-white p-5 shadow-none">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="workspaceName">Workspace name</Label>
              <Input
                id="workspaceName"
                value={workspaceName}
                onChange={(event) => setWorkspaceName(event.target.value)}
                onBlur={() => void handleWorkspaceNameBlur()}
                className="h-12 rounded-xl border-slate-200 bg-slate-50 shadow-none"
                placeholder="Northwind Heating & Air"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Workspace join code</Label>
                <div className="flex gap-2">
                  <Input
                    value={profile?.organizationJoinCode ?? ""}
                    readOnly
                    className="h-12 rounded-xl border-slate-200 bg-slate-50 shadow-none"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 rounded-xl border-slate-200 px-4"
                    onClick={() => void handleCopyJoinCode()}
                  >
                    <Copy className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="joinWorkspace">Join workspace by code</Label>
                <Input
                  id="joinWorkspace"
                  value={joinCodeInput}
                  onChange={(event) => setJoinCodeInput(event.target.value.toUpperCase())}
                  onBlur={() => void handleJoinWorkspace()}
                  className="h-12 rounded-xl border-slate-200 bg-slate-50 shadow-none"
                  placeholder="AB12CD34"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Access role</Label>
              <Select
                value={profile?.role ?? "manager"}
                onValueChange={async (role) => {
                  try {
                    await setRole(role as "manager" | "rep");
                    toast.success("Access role updated.");
                  } catch (error) {
                    toast.error(getErrorMessage(error, "Could not update your role."));
                  }
                }}
              >
                <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-slate-50 shadow-none">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="rep">Sales rep</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyName">Company name</Label>
              <Input
                id="companyName"
                value={companyProfile.companyName}
                onChange={(event) => updateCompanyProfile({ companyName: event.target.value })}
                className="h-12 rounded-xl border-slate-200 bg-slate-50 shadow-none"
                placeholder="Northwind Heating & Air"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="companyPhone">Company phone</Label>
                <Input
                  id="companyPhone"
                  value={companyProfile.companyPhone}
                  onChange={(event) => updateCompanyProfile({ companyPhone: event.target.value })}
                  className="h-12 rounded-xl border-slate-200 bg-slate-50 shadow-none"
                  placeholder="(555) 420-4822"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyEmail">Company email</Label>
                <Input
                  id="companyEmail"
                  type="email"
                  value={companyProfile.companyEmail}
                  onChange={(event) => updateCompanyProfile({ companyEmail: event.target.value })}
                  className="h-12 rounded-xl border-slate-200 bg-slate-50 shadow-none"
                  placeholder="quotes@yourcompany.com"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="companyLicense">License</Label>
                <Input
                  id="companyLicense"
                  value={companyProfile.companyLicense}
                  onChange={(event) => updateCompanyProfile({ companyLicense: event.target.value })}
                  className="h-12 rounded-xl border-slate-200 bg-slate-50 shadow-none"
                  placeholder="LIC #HV-20491"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="salespersonName">Default salesperson</Label>
                <Input
                  id="salespersonName"
                  value={companyProfile.salespersonName}
                  onChange={(event) => updateCompanyProfile({ salespersonName: event.target.value })}
                  className="h-12 rounded-xl border-slate-200 bg-slate-50 shadow-none"
                  placeholder="Field Technician"
                />
              </div>
            </div>
          </div>

          {copyStatus ? <p className="text-sm text-slate-500">{copyStatus}</p> : null}
        </Card>

        <Card className="rounded-[24px] border-slate-200 bg-white p-5 shadow-none">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                <Users className="size-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Workspace Team</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Share the join code with teammates. Managers can update roles for current members.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-xl border-slate-200 px-4"
              onClick={() => void handleRefreshMembers()}
              disabled={isJoiningWorkspace}
            >
              Refresh
            </Button>
          </div>

          <div className="space-y-3">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 px-4 py-3">
                <div>
                  <p className="font-medium text-slate-950">{member.fullName || "Workspace member"}</p>
                  <p className="text-sm text-slate-600">{member.phone || "No phone on file"}</p>
                </div>
                {profile?.role === "manager" ? (
                  <div className="w-[140px]">
                    <Select
                      value={member.role}
                      onValueChange={async (role) => {
                        try {
                          await updateMemberRole(member.id, role as "manager" | "rep");
                          toast.success("Team member role updated.");
                        } catch (error) {
                          toast.error(getErrorMessage(error, "Could not update team member role."));
                        }
                      }}
                    >
                      <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-slate-50 shadow-none">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="rep">Sales rep</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <p className="text-sm font-medium text-slate-700">{member.role === "manager" ? "Manager" : "Sales rep"}</p>
                )}
              </div>
            ))}
          </div>
        </Card>

        <Card className="rounded-[24px] border-slate-200 bg-white p-5 shadow-none">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-950">Pricing Rules</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              These values drive quote math, payment estimates, and default upsell pricing.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="laborRatePerHour">Labor rate per hour</Label>
              <Input
                id="laborRatePerHour"
                type="number"
                value={pricingRules.laborRatePerHour}
                onChange={(event) =>
                  updatePricingRules({ laborRatePerHour: Number(event.target.value) || 0 })
                }
                className="h-12 rounded-xl border-slate-200 bg-slate-50 shadow-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="marginFloorPercent">Margin floor %</Label>
              <Input
                id="marginFloorPercent"
                type="number"
                value={pricingRules.marginFloorPercent}
                onChange={(event) =>
                  updatePricingRules({ marginFloorPercent: Number(event.target.value) || 0 })
                }
                className="h-12 rounded-xl border-slate-200 bg-slate-50 shadow-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxDiscountPercent">Max discount %</Label>
              <Input
                id="maxDiscountPercent"
                type="number"
                value={pricingRules.maxDiscountPercent}
                onChange={(event) =>
                  updatePricingRules({ maxDiscountPercent: Number(event.target.value) || 0 })
                }
                className="h-12 rounded-xl border-slate-200 bg-slate-50 shadow-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultFinancingApr">Default financing APR</Label>
              <Input
                id="defaultFinancingApr"
                type="number"
                step="0.01"
                value={pricingRules.defaultFinancingApr}
                onChange={(event) =>
                  updatePricingRules({ defaultFinancingApr: Number(event.target.value) || 0 })
                }
                className="h-12 rounded-xl border-slate-200 bg-slate-50 shadow-none"
              />
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="thermostatUpgradePrice">Thermostat upgrade</Label>
              <Input
                id="thermostatUpgradePrice"
                type="number"
                value={pricingRules.thermostatUpgradePrice}
                onChange={(event) =>
                  updatePricingRules({ thermostatUpgradePrice: Number(event.target.value) || 0 })
                }
                className="h-12 rounded-xl border-slate-200 bg-slate-50 shadow-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="iaqBundlePrice">IAQ bundle</Label>
              <Input
                id="iaqBundlePrice"
                type="number"
                value={pricingRules.iaqBundlePrice}
                onChange={(event) => updatePricingRules({ iaqBundlePrice: Number(event.target.value) || 0 })}
                className="h-12 rounded-xl border-slate-200 bg-slate-50 shadow-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="surgeProtectionPrice">Surge protection</Label>
              <Input
                id="surgeProtectionPrice"
                type="number"
                value={pricingRules.surgeProtectionPrice}
                onChange={(event) =>
                  updatePricingRules({ surgeProtectionPrice: Number(event.target.value) || 0 })
                }
                className="h-12 rounded-xl border-slate-200 bg-slate-50 shadow-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maintenancePlanPrice">Maintenance plan</Label>
              <Input
                id="maintenancePlanPrice"
                type="number"
                value={pricingRules.maintenancePlanPrice}
                onChange={(event) =>
                  updatePricingRules({ maintenancePlanPrice: Number(event.target.value) || 0 })
                }
                className="h-12 rounded-xl border-slate-200 bg-slate-50 shadow-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="extendedLaborWarrantyPrice">Extended labor warranty</Label>
              <Input
                id="extendedLaborWarrantyPrice"
                type="number"
                value={pricingRules.extendedLaborWarrantyPrice}
                onChange={(event) =>
                  updatePricingRules({
                    extendedLaborWarrantyPrice: Number(event.target.value) || 0,
                  })
                }
                className="h-12 rounded-xl border-slate-200 bg-slate-50 shadow-none"
              />
            </div>
          </div>
        </Card>

        {profile?.role === "manager" ? (
          <Card className="rounded-[24px] border-slate-200 bg-white p-5 shadow-none">
            <div className="mb-4 flex items-start gap-3">
              <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-700">
                <Activity className="size-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Outcome Analytics</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  See which reps, vendor paths, and package tiers are actually converting.
                </p>
              </div>
            </div>

            {isLoadingOutcomeAnalytics ? (
              <p className="text-sm text-slate-500">Loading outcome analytics...</p>
            ) : outcomeAnalytics ? (
              <div className="space-y-4 text-sm text-slate-700">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-slate-500">Overall close rate</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-950">{outcomeAnalytics.overallAcceptanceRate}%</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-slate-500">Closed proposals analyzed</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-950">{outcomeAnalytics.totalClosedEstimates}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-medium text-slate-950">Top reps</p>
                  <p className="mt-2 text-slate-600">
                    {outcomeAnalytics.repPerformance.length > 0
                      ? outcomeAnalytics.repPerformance.map((rep) => `${rep.name}: ${rep.rate}% (${rep.accepted}/${rep.accepted + rep.lost})`).join(", ")
                      : "No closed estimate data yet."}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-medium text-slate-950">Top vendor paths</p>
                  <p className="mt-2 text-slate-600">
                    {outcomeAnalytics.vendorPerformance.length > 0
                      ? outcomeAnalytics.vendorPerformance.map((vendor) => `${vendor.name}: ${vendor.rate}% (${vendor.accepted}/${vendor.accepted + vendor.lost})`).join(", ")
                      : "No vendor conversion data yet."}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-medium text-slate-950">Top package tiers</p>
                  <p className="mt-2 text-slate-600">
                    {outcomeAnalytics.packagePerformance.length > 0
                      ? outcomeAnalytics.packagePerformance.map((pkg) => `${pkg.name}: ${pkg.rate}% (${pkg.accepted}/${pkg.accepted + pkg.lost})`).join(", ")
                      : "No package conversion data yet."}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">No outcome analytics yet.</p>
            )}
          </Card>
        ) : null}

        {profile?.role === "manager" ? (
          <Card className="rounded-[24px] border-slate-200 bg-white p-5 shadow-none">
            <div className="mb-4 flex items-start gap-3">
              <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                <Activity className="size-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Quote Health</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Monitor vendor readiness and whether the quote engine is leaning on fallbacks.
                </p>
              </div>
            </div>

            {isLoadingObservability ? (
              <p className="text-sm text-slate-500">Loading quote health...</p>
            ) : observabilitySummary ? (
              <div className="space-y-4 text-sm text-slate-700">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-slate-500">Recent quote requests</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-950">{observabilitySummary.totalRequests}</p>
                    <p className="mt-1 text-slate-600">
                      Last request: {observabilitySummary.latestRequestAt ? new Date(observabilitySummary.latestRequestAt).toLocaleString() : "No requests yet"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-slate-500">Fallback activity</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-950">{observabilitySummary.fallbackUsedCount}</p>
                    <p className="mt-1 text-slate-600">
                      AI used on {observabilitySummary.aiUsedCount} recent requests
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    <p className="text-emerald-700">Connected vendors</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-950">{observabilitySummary.connectedVendorCount}</p>
                  </div>
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-amber-700">Need setup</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-950">{observabilitySummary.vendorNeedsSetupCount}</p>
                  </div>
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                    <p className="text-rose-700">Vendor errors</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-950">{observabilitySummary.vendorErrorCount}</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-slate-500">Sent proposals</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-950">{observabilitySummary.sentEstimateCount}</p>
                  </div>
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    <p className="text-emerald-700">Accepted</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-950">{observabilitySummary.acceptedEstimateCount}</p>
                  </div>
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                    <p className="text-rose-700">Lost</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-950">{observabilitySummary.lostEstimateCount}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-medium text-slate-950">Top recommended vendors</p>
                  <p className="mt-1 text-slate-600">
                    {observabilitySummary.topRecommendedVendors.length > 0
                      ? observabilitySummary.topRecommendedVendors.map((vendor) => `${vendor.name} (${vendor.count})`).join(", ")
                      : "No recommendation data yet."}
                  </p>
                  <p className="mt-2 text-slate-600">
                    Latest fallback reason: {observabilitySummary.latestFallbackReason || "No fallback reason recorded recently."}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">No quote health data yet.</p>
            )}
          </Card>
        ) : null}

        {profile?.role === "manager" ? (
          <Card className="rounded-[24px] border-slate-200 bg-white p-5 shadow-none">
            <div className="mb-4 flex items-start gap-3">
              <div className="rounded-2xl bg-amber-50 p-3 text-amber-700">
                <PlugZap className="size-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Vendor Integrations</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Configure supplier connection modes now so real adapters can be plugged in without changing the quote flow.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {isLoadingVendors ? (
                <p className="text-sm text-slate-500">Loading vendor integrations...</p>
              ) : vendors.length === 0 ? (
                <p className="text-sm text-slate-500">No vendor integrations found yet.</p>
              ) : (
                vendors.map((vendor) => (
                  <div key={vendor.id} className="rounded-2xl border border-slate-200 p-4">
                    {vendor.slug === "supply-pro" ? (
                      <div className="mb-3 rounded-2xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-900">
                        First live adapter target.
                        Use `manual-api`, set the adapter endpoint, then add the Supabase secret `VENDOR_SUPPLY_PRO_API_KEY`.
                      </div>
                    ) : null}
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-950">{vendor.name}</p>
                        <p className="mt-1 text-sm text-slate-600">
                          Status: {vendor.connectionStatus === "connected" ? "Connected" : vendor.connectionStatus === "error" ? "Error" : "Needs setup"}
                        </p>
                        {vendor.lastError ? (
                          <p className="mt-1 text-sm text-rose-600">{vendor.lastError}</p>
                        ) : null}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="h-10 rounded-xl border-slate-200 px-4"
                          onClick={() => void handleVendorTest(vendor)}
                          disabled={testingVendorId === vendor.id}
                        >
                          {testingVendorId === vendor.id ? "Testing..." : "Test"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-10 rounded-xl border-slate-200 px-4"
                          onClick={() => void handleVendorSave(vendor)}
                          disabled={savingVendorId === vendor.id}
                        >
                          {savingVendorId === vendor.id ? "Saving..." : "Save"}
                        </Button>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Integration mode</Label>
                        <Select
                          value={vendor.integrationMode}
                          onValueChange={(value) =>
                            handleVendorChange(vendor.id, {
                              integrationMode: value as VendorIntegration["integrationMode"],
                            })
                          }
                        >
                          <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-slate-50 shadow-none">
                            <SelectValue placeholder="Select mode" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mock">Mock fallback</SelectItem>
                            <SelectItem value="catalog">Catalog-backed</SelectItem>
                            <SelectItem value="manual-api">Manual API adapter</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Priority</Label>
                        <Input
                          type="number"
                          value={vendor.priority}
                          onChange={(event) =>
                            handleVendorChange(vendor.id, {
                              priority: Number(event.target.value) || 100,
                            })
                          }
                          className="h-12 rounded-xl border-slate-200 bg-slate-50 shadow-none"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Endpoint URL</Label>
                        <Input
                          value={vendor.endpointUrl}
                          onChange={(event) =>
                            handleVendorChange(vendor.id, {
                              endpointUrl: event.target.value,
                            })
                          }
                          className="h-12 rounded-xl border-slate-200 bg-slate-50 shadow-none"
                          placeholder="https://vendor.example.com/quotes"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Branch code</Label>
                        <Input
                          value={vendor.branchCode}
                          onChange={(event) =>
                            handleVendorChange(vendor.id, {
                              branchCode: event.target.value,
                            })
                          }
                          className="h-12 rounded-xl border-slate-200 bg-slate-50 shadow-none"
                          placeholder="DFW-01"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Account number</Label>
                        <Input
                          value={vendor.accountNumber}
                          onChange={(event) =>
                            handleVendorChange(vendor.id, {
                              accountNumber: event.target.value,
                            })
                          }
                          className="h-12 rounded-xl border-slate-200 bg-slate-50 shadow-none"
                          placeholder="123456"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Supported system types</Label>
                        <Input
                          value={vendor.supportedSystemTypes.join(", ")}
                          onChange={(event) => handleVendorSystemTypesChange(vendor.id, event.target.value)}
                          className="h-12 rounded-xl border-slate-200 bg-slate-50 shadow-none"
                          placeholder="Split system, Heat pump"
                        />
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 sm:grid-cols-[120px_1fr]">
                      <div className="space-y-2">
                        <Label>Enabled</Label>
                        <Select
                          value={vendor.active ? "enabled" : "disabled"}
                          onValueChange={(value) =>
                            handleVendorChange(vendor.id, {
                              active: value === "enabled",
                            })
                          }
                        >
                          <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-slate-50 shadow-none">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="enabled">Enabled</SelectItem>
                            <SelectItem value="disabled">Disabled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Manager notes</Label>
                        <Input
                          value={vendor.notes}
                          onChange={(event) =>
                            handleVendorChange(vendor.id, {
                              notes: event.target.value,
                            })
                          }
                          className="h-12 rounded-xl border-slate-200 bg-slate-50 shadow-none"
                          placeholder="Credential lives in Edge Function secret VENDOR_SUPPLY_PRO_API_KEY"
                        />
                      </div>
                    </div>

                    {vendorTestResults[vendor.id] ? (
                      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                        <p className="font-medium text-slate-950">Last test</p>
                        <p className="mt-1">Checked at {vendorTestResults[vendor.id].checkedAt}</p>
                        <p className="mt-1">Mode: {vendorTestResults[vendor.id].mode}</p>
                        <p className="mt-1">Endpoint: {vendorTestResults[vendor.id].endpointUrl || "Not configured"}</p>
                        <p className="mt-1">
                          Secret configured: {vendorTestResults[vendor.id].secretConfigured ? "Yes" : "No"}
                        </p>
                        <p className="mt-1">
                          Product count returned: {vendorTestResults[vendor.id].productCount}
                        </p>
                        <p className="mt-1">{vendorTestResults[vendor.id].message}</p>
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </Card>
        ) : null}

        {profile?.role === "manager" ? (
          <Card className="rounded-[24px] border-slate-200 bg-white p-5 shadow-none">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Backend Diagnostics</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Verifies the live `generate-quotes` edge function through your signed-in session.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-xl border-slate-200 px-4"
                onClick={() => void handleQuoteBackendSmokeTest()}
                disabled={isRunningSmokeTest}
              >
                {isRunningSmokeTest ? "Running..." : "Run Smoke Test"}
              </Button>
            </div>

            {smokeTestResult ? (
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-sm text-slate-700">
                <p className="font-semibold text-slate-950">Last successful run</p>
                <p className="mt-1">Ran at {smokeTestResult.ranAt}</p>
                <p className="mt-1">{smokeTestResult.optionCount} options returned from the backend.</p>
                <p className="mt-1">{smokeTestResult.comparedVendorCount} vendor comparisons generated.</p>
                <p className="mt-1">
                  Recommended suppliers: {smokeTestResult.recommendedVendors.join(", ") || "None returned"}
                </p>
                <p className="mt-1">
                  Latest logged request: {smokeTestResult.latestRequestId} for {smokeTestResult.latestRequestCustomer}
                </p>
                <p className="mt-1">{smokeTestResult.latestRequestItemCount} vendor quote rows recorded.</p>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">
                No smoke test has been run in this session yet.
              </p>
            )}
          </Card>
        ) : null}

        <p className="text-center text-sm text-slate-500">
          Changes save automatically and apply to the current proposal plus the next estimate you start.
        </p>
      </div>
    </AppShell>
  );
}
