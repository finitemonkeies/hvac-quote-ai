import type { EstimateDraft, PricingRules, ProposalCompany, QuoteOption } from "../types/estimate";
import { calculateMonthlyPayment, formatCurrency } from "../lib/format";

function buildProposalMarkup(
  draft: EstimateDraft,
  pricingRules: PricingRules,
  proposal: ProposalCompany,
  options: QuoteOption[],
  selectedOptionId: string | null,
) {
  const selectedOption = options.find((option) => option.id === selectedOptionId);
  const monthlyPayment =
    draft.financingEnabled && selectedOption
      ? Math.round(
          calculateMonthlyPayment(
            selectedOption.estimatedPrice,
            pricingRules.defaultFinancingApr,
            Math.max(draft.financingTermMonths, 1),
          ),
        )
      : null;
  const selectedAddOns =
    [
      draft.thermostatUpgrade && "Smart thermostat",
      draft.iaqBundle && "IAQ bundle",
      draft.surgeProtection && "Surge protection",
      draft.maintenancePlan && "Maintenance plan",
      draft.extendedLaborWarranty && "Extended labor warranty",
    ]
      .filter(Boolean)
      .join(", ") || "None selected";

  return `
    <html>
      <head>
        <title>${proposal.companyName} Proposal</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 24px; color: #102235; }
          h1, h2, h3, p { margin: 0; }
          .header { margin-bottom: 24px; }
          .meta { color: #516173; margin-top: 8px; font-size: 14px; }
          .card { border: 1px solid #d6dde4; border-radius: 16px; padding: 16px; margin-bottom: 16px; }
          .recommended { border: 2px solid #0f766e; background: #f0fdfa; }
          .price { font-size: 28px; font-weight: bold; margin: 8px 0; }
          ul { padding-left: 20px; }
          .summary { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
          .selected { margin-top: 12px; color: #0f766e; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${proposal.companyName}</h1>
          <p class="meta">${proposal.companyPhone} | ${proposal.companyEmail}</p>
          <p class="meta">${proposal.companyLicense}</p>
        </div>
        <div class="summary">
          <div><strong>Customer</strong><br/>${draft.customerName || "Homeowner"}</div>
          <div><strong>Property</strong><br/>${draft.propertyAddress || "On-site estimate"}</div>
          <div><strong>Customer phone</strong><br/>${draft.customerPhone || "Not provided"}</div>
          <div><strong>Customer email</strong><br/>${draft.customerEmail || "Not provided"}</div>
          <div><strong>Job type</strong><br/>${draft.jobType}</div>
          <div><strong>System type</strong><br/>${draft.systemType}</div>
          <div><strong>Existing system</strong><br/>${draft.existingSystemType}${draft.existingSystemAge ? `, ${draft.existingSystemAge}` : ""}</div>
          <div><strong>Fuel / condition</strong><br/>${draft.existingFuelType} | ${draft.existingSystemCondition}</div>
          <div><strong>Access / location</strong><br/>${draft.accessDifficulty} | ${draft.installLocation}</div>
          <div><strong>Comfort notes</strong><br/>${draft.comfortIssues || "No additional comfort concerns noted"}</div>
          <div><strong>Package / brand</strong><br/>${draft.equipmentPackage} | ${draft.preferredBrand}</div>
          <div><strong>Target margin</strong><br/>${Math.max(draft.targetGrossMargin, pricingRules.marginFloorPercent)}%</div>
          <div><strong>Add-ons</strong><br/>${selectedAddOns}</div>
          <div><strong>Financing</strong><br/>${draft.financingEnabled && monthlyPayment ? `${formatCurrency(monthlyPayment)} / month at ${pricingRules.defaultFinancingApr}% APR for ${draft.financingTermMonths} months` : "Not shown"}</div>
        </div>
        ${options
          .map(
            (option) => `
              <div class="card ${option.isRecommended ? "recommended" : ""}">
                <h2>${option.title}</h2>
                <p>${option.systemName}</p>
                <div class="price">${formatCurrency(option.estimatedPrice)}</div>
                <p>${option.description}</p>
                <p class="meta">${formatCurrency(option.priceRangeLow)} - ${formatCurrency(option.priceRangeHigh)}</p>
                <ul>
                  ${option.features.map((feature) => `<li>${feature}</li>`).join("")}
                </ul>
                ${
                  selectedOption?.id === option.id
                    ? `<p class="selected">Selected option for follow-up</p>`
                    : ""
                }
              </div>
            `,
          )
          .join("")}
      </body>
    </html>
  `;
}

export function downloadProposalPdf(
  draft: EstimateDraft,
  pricingRules: PricingRules,
  proposal: ProposalCompany,
  options: QuoteOption[],
  selectedOptionId: string | null,
) {
  const printWindow = window.open("", "_blank", "width=900,height=1200");
  if (!printWindow) {
    return;
  }

  printWindow.document.write(buildProposalMarkup(draft, pricingRules, proposal, options, selectedOptionId));
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

export async function shareProposal(
  draft: EstimateDraft,
  options: QuoteOption[],
  selectedOptionId: string | null,
) {
  const selected = options.find((option) => option.id === selectedOptionId) ?? options[1] ?? options[0];
  const text = [
    `${draft.customerName || "Customer"} proposal`,
    `${selected.systemName} - ${formatCurrency(selected.estimatedPrice)}`,
    selected.description,
  ].join("\n");

  if (navigator.share) {
    await navigator.share({
      title: "HVAC Proposal",
      text,
    });
    return true;
  }

  return false;
}
