import { useEffect, useState } from "react";
import { Building2, Copy, PlugZap, Users } from "lucide-react";
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
  fetchVendorIntegrationsFromSupabase,
  fetchLatestVendorQuoteRequestSummary,
  generateQuoteOptionsViaSupabase,
  saveVendorIntegrationToSupabase,
} from "../services/supabase";
import type { VendorIntegration } from "../types/estimate";

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
