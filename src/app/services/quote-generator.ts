import type { EstimateDraft, PricingRules, QuoteOption, QuoteOptionInput } from "../types/estimate";
import { calculateMonthlyPayment } from "../lib/format";
import { generateQuoteOptionsViaSupabase, supabase } from "./supabase";
import { enrichOptionsWithVendorComparisons } from "./vendor-marketplace";

function calculateBaseHardCost(draft: EstimateDraft, pricingRules: PricingRules) {
  const sizeFactor = Math.max(draft.homeSize, 1200) / 100;
  const packageMultiplier =
    draft.equipmentPackage === "Value replacement"
      ? 0.94
      : draft.equipmentPackage === "High-efficiency match"
        ? 1.08
        : draft.equipmentPackage === "Premium comfort package"
          ? 1.16
          : 1;
  const brandMultiplier =
    draft.preferredBrand === "Open"
      ? 1
      : draft.preferredBrand === "Carrier" || draft.preferredBrand === "Trane" || draft.preferredBrand === "Lennox"
        ? 1.08
        : 1.04;
  const baseEquipment = (draft.equipmentCost || sizeFactor * 210) * packageMultiplier * brandMultiplier;
  const laborCost = (draft.laborHours || 10) * pricingRules.laborRatePerHour;
  const materialsCost = draft.materials || 450;
  const scopePremium = draft.projectScope.includes("Relocate") ? 2200 : 0;
  const removalPremium = draft.removalNeeded ? 650 : 0;
  const permitPremium = draft.permitRequired ? 450 : 0;
  const accessPremium =
    draft.accessDifficulty === "Tight attic / crawl"
      ? 900
      : draft.accessDifficulty === "Multi-story carry"
        ? 1200
        : draft.accessDifficulty === "Roof / crane concern"
          ? 2200
          : 0;
  const locationPremium =
    draft.installLocation === "Attic"
      ? 700
      : draft.installLocation === "Crawlspace"
        ? 900
        : draft.installLocation === "Roof"
          ? 1800
          : 0;
  const conditionPremium =
    draft.existingSystemCondition === "No cooling / no heating"
      ? 550
      : draft.existingSystemCondition === "Frequent breakdowns"
        ? 350
        : 0;
  const thermostatPremium = draft.thermostatUpgrade ? pricingRules.thermostatUpgradePrice : 0;
  const iaqPremium = draft.iaqBundle ? pricingRules.iaqBundlePrice : 0;
  const surgePremium = draft.surgeProtection ? pricingRules.surgeProtectionPrice : 0;
  const maintenancePremium = draft.maintenancePlan ? pricingRules.maintenancePlanPrice : 0;
  const warrantyPremium = draft.extendedLaborWarranty ? pricingRules.extendedLaborWarrantyPrice : 0;
  const ductworkPremium =
    draft.ductworkCondition === "Needs modifications"
      ? 1100
      : draft.ductworkCondition === "Replace major sections"
        ? 2200
        : 0;

  return (
    baseEquipment +
    laborCost +
    materialsCost +
    scopePremium +
    removalPremium +
    permitPremium +
    accessPremium +
    locationPremium +
    conditionPremium +
    thermostatPremium +
    iaqPremium +
    surgePremium +
    maintenancePremium +
    warrantyPremium +
    ductworkPremium
  );
}

export function applyQuotePolicy(
  draft: EstimateDraft,
  pricingRules: PricingRules,
  options: Array<QuoteOption | QuoteOptionInput & { id: string; level: QuoteOption["level"]; title: string; isRecommended: boolean }>,
): QuoteOption[] {
  const baseHardCost = calculateBaseHardCost(draft, pricingRules);
  const baselineMultiplierByLevel: Record<QuoteOption["level"], number> = {
    good: 0.9,
    better: 1,
    best: 1.24,
  };

  const floorMargin = pricingRules.marginFloorPercent;

  return options.map((option) => {
    const hardCost = Math.round(baseHardCost * baselineMultiplierByLevel[option.level]);
    const grossMarginPercent =
      option.estimatedPrice > 0 ? Math.round(((option.estimatedPrice - hardCost) / option.estimatedPrice) * 100) : 0;
    const discountPercent =
      option.priceRangeHigh > 0
        ? Math.max(0, Math.round(((option.priceRangeHigh - option.estimatedPrice) / option.priceRangeHigh) * 100))
        : 0;
    const needsMarginApproval = grossMarginPercent < floorMargin;
    const needsDiscountApproval = discountPercent > pricingRules.maxDiscountPercent;
    const policyStatus = needsMarginApproval || needsDiscountApproval ? "needs-approval" : "approved";
    const policyReason = needsMarginApproval
      ? `Margin ${grossMarginPercent}% is below floor ${floorMargin}%`
      : needsDiscountApproval
        ? `Discount ${discountPercent}% exceeds max ${pricingRules.maxDiscountPercent}%`
        : null;

    return {
      ...option,
      hardCost,
      grossMarginPercent,
      policyStatus,
      policyReason,
      estimatedMonthlyPayment: draft.financingEnabled
        ? Math.round(
            calculateMonthlyPayment(
              option.estimatedPrice,
              pricingRules.defaultFinancingApr,
              Math.max(draft.financingTermMonths, 1),
            ),
          )
        : null,
    };
  });
}

function generateFallbackOptions(draft: EstimateDraft, pricingRules: PricingRules): QuoteOption[] {
  const hardCost = calculateBaseHardCost(draft, pricingRules);
  const effectiveMargin = Math.max(draft.targetGrossMargin, pricingRules.marginFloorPercent);
  const marginMultiplier = 1 / Math.max(0.2, 1 - effectiveMargin / 100);
  const betterPrice = Math.round(hardCost * marginMultiplier);
  const goodPrice = Math.round(betterPrice * 0.9);
  const bestPrice = Math.round(betterPrice * 1.24);

  const installNote =
    draft.installTimeline === "ASAP"
      ? "Priority scheduling for fast install turnaround"
      : "Standard install scheduling with startup and testing";
  const accessNote =
    draft.accessDifficulty === "Standard access"
      ? "Standard access labor assumed"
      : `Install plan accounts for ${draft.accessDifficulty.toLowerCase()}`;
  const conditionNote = draft.existingSystemAge
    ? `Replacement planned around an existing ${draft.existingSystemType.toLowerCase()} approximately ${draft.existingSystemAge.toLowerCase()} old`
    : `Replacement planned around an existing ${draft.existingSystemType.toLowerCase()} system`;
  const comfortNote = draft.comfortIssues
    ? `Addresses comfort concerns noted on-site: ${draft.comfortIssues}`
    : "Airflow and comfort settings tuned to current home conditions";
  const packageNote =
    draft.preferredBrand === "Open"
      ? `${draft.equipmentPackage} built around best-available matched equipment`
      : `${draft.equipmentPackage} built around ${draft.preferredBrand} preference`;
  const upsellFeatures = [
    draft.thermostatUpgrade ? "Connected thermostat upgrade included" : null,
    draft.iaqBundle ? "IAQ bundle with filtration / purification upgrades" : null,
    draft.surgeProtection ? "Outdoor surge protection included" : null,
    draft.maintenancePlan ? "First-year maintenance membership included" : null,
    draft.extendedLaborWarranty ? "Extended labor warranty coverage included" : null,
  ].filter(Boolean) as string[];

  return enrichOptionsWithVendorComparisons(
    draft,
    pricingRules,
    applyQuotePolicy(
      draft,
      pricingRules,
      sanitizeOptions([
    {
      level: "good",
      systemName: "14 SEER2 Comfort System",
      description: "Reliable replacement option focused on speed, simplicity, and everyday comfort.",
      features: [
        "Single-stage equipment package",
        "Matched indoor and outdoor system sizing",
        draft.thermostatUpgrade ? "Entry smart thermostat included" : "Basic programmable thermostat",
        installNote,
        accessNote,
      ],
      estimatedPrice: goodPrice,
      priceRangeLow: Math.round(goodPrice * 0.96),
      priceRangeHigh: Math.round(goodPrice * 1.05),
    },
    {
      level: "better",
      systemName: "16 SEER2 Performance System",
      description: "Balanced comfort and efficiency for the homeowner who wants solid long-term value.",
      features: [
        "Higher efficiency compressor and blower pairing",
        draft.thermostatUpgrade ? "Smart thermostat setup and commissioning" : "System setup and commissioning",
        "Improved airflow tuning for the existing home",
        packageNote,
        "Permit coordination and haul-away included",
        conditionNote,
        ...upsellFeatures.slice(0, 1),
      ],
      estimatedPrice: betterPrice,
      priceRangeLow: Math.round(betterPrice * 0.95),
      priceRangeHigh: Math.round(betterPrice * 1.06),
    },
    {
      level: "best",
      systemName: "20 SEER2 High Efficiency System",
      description: "Premium comfort package with quieter operation, stronger humidity control, and top-end efficiency.",
      features: [
        "Variable-speed indoor comfort performance",
        "Enhanced humidity and airflow control",
        draft.thermostatUpgrade ? "Smart thermostat with homeowner orientation" : "Premium control setup and homeowner orientation",
        "Higher-efficiency filtration and startup testing",
        comfortNote,
        ...upsellFeatures.slice(0, 2),
      ],
      estimatedPrice: bestPrice,
      priceRangeLow: Math.round(bestPrice * 0.95),
      priceRangeHigh: Math.round(bestPrice * 1.08),
    },
      ]),
    ),
  );
}

export async function generateQuoteOptions(draft: EstimateDraft, pricingRules: PricingRules) {
  if (supabase) {
    try {
      return await generateQuoteOptionsViaSupabase({ draft, pricingRules });
    } catch (error) {
      console.warn("Falling back from Supabase quote generation", error);
    }
  }

  return generateFallbackOptions(draft, pricingRules);
}
