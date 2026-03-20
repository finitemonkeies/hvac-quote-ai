import type { EstimateDraft, PricingRules, QuoteLevel, QuoteOption, VendorAvailability, VendorComparison } from "../types/estimate";

type VendorProfile = {
  id: string;
  name: string;
  brand: string;
  modelFamilies: Record<QuoteLevel, string>;
  equipmentFactor: number;
  leadTimeDays: number;
  availability: VendorAvailability;
  rebateByLevel: Record<QuoteLevel, number>;
  noteTemplate: string;
};

const VENDORS: VendorProfile[] = [
  {
    id: "supply-pro",
    name: "Supply Pro Distribution",
    brand: "RunTru",
    modelFamilies: {
      good: "Builder Series Split",
      better: "Performance Variable Fan",
      best: "Comfort Inverter Plus",
    },
    equipmentFactor: 0.96,
    leadTimeDays: 2,
    availability: "in-stock",
    rebateByLevel: { good: 0, better: 250, best: 450 },
    noteTemplate: "Fast-turn regional stock with reliable standard replacements.",
  },
  {
    id: "comfort-warehouse",
    name: "Comfort Warehouse",
    brand: "Goodman",
    modelFamilies: {
      good: "GS Split Essentials",
      better: "Two-Stage Comfort Pairing",
      best: "Inverter QuietDrive",
    },
    equipmentFactor: 1.01,
    leadTimeDays: 4,
    availability: "limited",
    rebateByLevel: { good: 100, better: 300, best: 500 },
    noteTemplate: "Strong rebate posture with homeowner-friendly upgrade packages.",
  },
  {
    id: "premier-hvac",
    name: "Premier HVAC Supply",
    brand: "Carrier",
    modelFamilies: {
      good: "Comfort Standard Match",
      better: "Performance Hybrid Match",
      best: "Infinity Variable Platform",
    },
    equipmentFactor: 1.08,
    leadTimeDays: 6,
    availability: "special-order",
    rebateByLevel: { good: 0, better: 200, best: 350 },
    noteTemplate: "Premium brand path for homeowners prioritizing perceived value and quiet operation.",
  },
];

function getPackageLevelMultiplier(level: QuoteLevel) {
  if (level === "good") {
    return 0.88;
  }

  if (level === "best") {
    return 1.18;
  }

  return 1;
}

function getBrandPreferenceFactor(draft: EstimateDraft, brand: string) {
  if (draft.preferredBrand === "Open") {
    return 1;
  }

  return draft.preferredBrand.toLowerCase() === brand.toLowerCase() ? 0.97 : 1.03;
}

function getInstallComplexityFactor(draft: EstimateDraft) {
  let factor = 1;

  if (draft.installLocation === "Attic" || draft.installLocation === "Crawlspace") {
    factor += 0.03;
  }

  if (draft.accessDifficulty === "Roof / crane concern") {
    factor += 0.06;
  }

  if (draft.projectScope.includes("Relocate")) {
    factor += 0.05;
  }

  return factor;
}

function calculateBaselineEquipmentCost(draft: EstimateDraft, level: QuoteLevel) {
  const packageMultiplier =
    draft.equipmentPackage === "Value replacement"
      ? 0.94
      : draft.equipmentPackage === "High-efficiency match"
        ? 1.08
        : draft.equipmentPackage === "Premium comfort package"
          ? 1.16
          : 1;

  return (draft.equipmentCost || Math.max(draft.homeSize, 1200) * 2.1) * packageMultiplier * getPackageLevelMultiplier(level);
}

function calculateComparisonPrice(
  option: QuoteOption,
  baselineEquipmentCost: number,
  vendorEquipmentCost: number,
  effectiveMarginPercent: number,
  rebateAmount: number,
) {
  const equipmentDelta = vendorEquipmentCost - baselineEquipmentCost - rebateAmount;
  const adjustedHardCost = Math.max(0, option.hardCost + equipmentDelta);
  const marginMultiplier = 1 / Math.max(0.2, 1 - effectiveMarginPercent / 100);
  return Math.round(adjustedHardCost * marginMultiplier);
}

function compareVendors(left: VendorComparison, right: VendorComparison) {
  const availabilityRank: Record<VendorAvailability, number> = {
    "in-stock": 0,
    limited: 1,
    "special-order": 2,
  };

  if (left.estimatedInstalledPrice !== right.estimatedInstalledPrice) {
    return left.estimatedInstalledPrice - right.estimatedInstalledPrice;
  }

  if (left.leadTimeDays !== right.leadTimeDays) {
    return left.leadTimeDays - right.leadTimeDays;
  }

  return availabilityRank[left.availability] - availabilityRank[right.availability];
}

export function enrichOptionsWithVendorComparisons(
  draft: EstimateDraft,
  pricingRules: PricingRules,
  options: QuoteOption[],
): QuoteOption[] {
  const effectiveMarginPercent = Math.max(draft.targetGrossMargin, pricingRules.marginFloorPercent);
  const complexityFactor = getInstallComplexityFactor(draft);

  return options.map((option) => {
    const baselineEquipmentCost = calculateBaselineEquipmentCost(draft, option.level);
    const vendorComparisons = VENDORS.map((vendor) => {
      const brandPreferenceFactor = getBrandPreferenceFactor(draft, vendor.brand);
      const vendorEquipmentCost = Math.round(
        baselineEquipmentCost * vendor.equipmentFactor * brandPreferenceFactor * complexityFactor,
      );
      const rebateAmount = vendor.rebateByLevel[option.level];

      return {
        vendorId: vendor.id,
        vendorName: vendor.name,
        packageLabel: `${vendor.brand} ${vendor.modelFamilies[option.level]}`,
        brand: vendor.brand,
        modelFamily: vendor.modelFamilies[option.level],
        estimatedInstalledPrice: calculateComparisonPrice(
          option,
          baselineEquipmentCost,
          vendorEquipmentCost,
          effectiveMarginPercent,
          rebateAmount,
        ),
        estimatedEquipmentCost: vendorEquipmentCost,
        leadTimeDays:
          draft.installTimeline === "ASAP"
            ? Math.max(1, vendor.leadTimeDays - 1)
            : vendor.leadTimeDays,
        availability: vendor.availability,
        rebateAmount,
        notes: vendor.noteTemplate,
      } satisfies VendorComparison;
    }).sort(compareVendors);

    const recommendedVendor = vendorComparisons[0] ?? null;
    const vendorStrategy = recommendedVendor
      ? `${recommendedVendor.vendorName} is the best fit for ${option.title.toLowerCase()} based on installed price and lead time.`
      : null;

    return {
      ...option,
      recommendedVendor,
      vendorComparisons,
      vendorStrategy,
      systemName: recommendedVendor ? recommendedVendor.packageLabel : option.systemName,
    };
  });
}
