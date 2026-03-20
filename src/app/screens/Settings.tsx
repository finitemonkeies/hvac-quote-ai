import { useEffect, useState } from "react";
import { Building2, Copy, Users } from "lucide-react";
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

export function Settings() {
  const { joinWorkspace, members, profile, refreshMembers, setRole, updateMemberRole, updateWorkspace } =
    useAuth();
  const { companyProfile, pricingRules, updateCompanyProfile, updatePricingRules } = useEstimate();
  const [workspaceName, setWorkspaceName] = useState(profile?.organizationName ?? "");
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [copyStatus, setCopyStatus] = useState("");

  useEffect(() => {
    setWorkspaceName(profile?.organizationName ?? "");
  }, [profile?.organizationName]);

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
                onBlur={() => {
                  if (workspaceName.trim() && workspaceName !== profile?.organizationName) {
                    void updateWorkspace({ name: workspaceName.trim() });
                  }
                }}
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
                    onClick={async () => {
                      if (!profile?.organizationJoinCode) {
                        return;
                      }

                      await navigator.clipboard.writeText(profile.organizationJoinCode);
                      setCopyStatus("Join code copied.");
                    }}
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
                  onBlur={() => {
                    if (joinCodeInput.trim()) {
                      void joinWorkspace(joinCodeInput.trim());
                      setJoinCodeInput("");
                    }
                  }}
                  className="h-12 rounded-xl border-slate-200 bg-slate-50 shadow-none"
                  placeholder="AB12CD34"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Access role</Label>
              <Select value={profile?.role ?? "manager"} onValueChange={(role) => void setRole(role as "manager" | "rep")}>
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
            <Button type="button" variant="outline" className="h-10 rounded-xl border-slate-200 px-4" onClick={() => void refreshMembers()}>
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
                      onValueChange={(role) => void updateMemberRole(member.id, role as "manager" | "rep")}
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

        <p className="text-center text-sm text-slate-500">
          Changes save automatically and apply to the current proposal plus the next estimate you start.
        </p>
      </div>
    </AppShell>
  );
}
