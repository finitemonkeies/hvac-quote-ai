const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type QuoteOption = {
  id: string;
  level: "good" | "better" | "best";
  title: string;
  systemName: string;
  description: string;
  features: string[];
  estimatedPrice: number;
  priceRangeLow: number;
  priceRangeHigh: number;
  isRecommended: boolean;
};

type ProposalPayload = {
  customerEmail: string;
  draft: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    propertyAddress: string;
    jobType: string;
    systemType: string;
    existingSystemType: string;
    existingSystemAge: string;
    existingFuelType: string;
    existingSystemCondition: string;
    installLocation: string;
    accessDifficulty: string;
    comfortIssues: string;
    equipmentPackage: string;
    preferredBrand: string;
    targetGrossMargin: number;
    financingEnabled: boolean;
    financingTermMonths: number;
    maintenancePlan: boolean;
    surgeProtection: boolean;
    iaqBundle: boolean;
    extendedLaborWarranty: boolean;
    thermostatUpgrade: boolean;
  };
  pricingRules: {
    laborRatePerHour: number;
    marginFloorPercent: number;
    defaultFinancingApr: number;
    thermostatUpgradePrice: number;
    iaqBundlePrice: number;
    surgeProtectionPrice: number;
    maintenancePlanPrice: number;
    extendedLaborWarrantyPrice: number;
  };
  proposal: {
    companyName: string;
    companyPhone: string;
    companyEmail: string;
    companyLicense: string;
    salespersonName: string;
  };
  options: QuoteOption[];
  selectedOptionId: string | null;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function calculateMonthlyPayment(total: number, apr: number, termMonths: number) {
  if (termMonths <= 0) {
    return 0;
  }

  const monthlyRate = apr / 100 / 12;
  if (monthlyRate <= 0) {
    return total / termMonths;
  }

  const factor = Math.pow(1 + monthlyRate, termMonths);
  return (total * monthlyRate * factor) / (factor - 1);
}

function buildHtml(payload: ProposalPayload) {
  const selected = payload.options.find((option) => option.id === payload.selectedOptionId) ?? null;
  const monthlyPayment =
    payload.draft.financingEnabled && selected
      ? Math.round(
          calculateMonthlyPayment(
            selected.estimatedPrice,
            payload.pricingRules.defaultFinancingApr,
            Math.max(payload.draft.financingTermMonths, 1),
          ),
        )
      : null;
  const selectedAddOns =
    [
      payload.draft.thermostatUpgrade && "Smart thermostat",
      payload.draft.iaqBundle && "IAQ bundle",
      payload.draft.surgeProtection && "Surge protection",
      payload.draft.maintenancePlan && "Maintenance plan",
      payload.draft.extendedLaborWarranty && "Extended labor warranty",
    ]
      .filter(Boolean)
      .join(", ") || "None selected";

  return `
    <html>
      <body style="margin:0;padding:24px;background:#f4f7fb;font-family:Arial,sans-serif;color:#0f172a;">
        <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #dbe2ea;border-radius:20px;padding:24px;">
          <div style="margin-bottom:24px;">
            <div style="font-size:28px;font-weight:700;">${payload.proposal.companyName}</div>
            <div style="margin-top:8px;color:#475569;font-size:14px;">
              ${payload.proposal.companyPhone || ""}${payload.proposal.companyPhone && payload.proposal.companyEmail ? " | " : ""}${payload.proposal.companyEmail || ""}
            </div>
            ${payload.proposal.companyLicense ? `<div style="margin-top:4px;color:#64748b;font-size:13px;">${payload.proposal.companyLicense}</div>` : ""}
          </div>

          <div style="margin-bottom:24px;font-size:15px;line-height:1.6;color:#334155;">
            <p>Hello ${payload.draft.customerName || "there"},</p>
            <p>Please review your HVAC proposal for ${payload.draft.propertyAddress || "your project location"}.</p>
            ${
              payload.draft.customerPhone || payload.draft.customerEmail
                ? `<p style="margin-top:8px;">Contact on file: ${payload.draft.customerPhone || "No phone provided"}${
                    payload.draft.customerPhone && payload.draft.customerEmail ? " | " : ""
                  }${payload.draft.customerEmail || ""}</p>`
                : ""
            }
            <p style="margin-top:8px;">Existing equipment: ${payload.draft.existingSystemType}${
              payload.draft.existingSystemAge ? `, ${payload.draft.existingSystemAge}` : ""
            } | ${payload.draft.existingFuelType} | ${payload.draft.existingSystemCondition}</p>
            <p style="margin-top:8px;">Install conditions: ${payload.draft.accessDifficulty} | ${payload.draft.installLocation}</p>
            <p style="margin-top:8px;">Package / brand: ${payload.draft.equipmentPackage} | ${payload.draft.preferredBrand}</p>
            <p style="margin-top:8px;">Selected add-ons: ${selectedAddOns}</p>
            ${
              payload.draft.financingEnabled && monthlyPayment
                ? `<p style="margin-top:8px;">Estimated financing: ${formatCurrency(monthlyPayment)} / month at ${payload.pricingRules.defaultFinancingApr}% APR for ${payload.draft.financingTermMonths} months</p>`
                : ""
            }
            ${
              payload.draft.comfortIssues
                ? `<p style="margin-top:8px;">Comfort notes: ${payload.draft.comfortIssues}</p>`
                : ""
            }
          </div>

          <div style="display:grid;gap:14px;">
            ${payload.options
              .map((option) => {
                const border = option.isRecommended ? "#2f66f5" : "#dbe2ea";
                const accent = option.isRecommended ? "#2f66f5" : "#0f172a";
                return `
                  <div style="border:1px solid ${border};border-radius:18px;padding:18px;">
                    <div style="display:flex;justify-content:space-between;gap:18px;align-items:flex-start;">
                      <div>
                        <div style="font-size:20px;font-weight:700;color:${accent};">${option.title}</div>
                        <div style="margin-top:4px;font-size:14px;color:#475569;">${option.description}</div>
                      </div>
                      ${option.isRecommended ? `<div style="background:#2f66f5;color:#fff;border-radius:999px;padding:6px 10px;font-size:11px;font-weight:700;text-transform:uppercase;">Recommended</div>` : ""}
                    </div>
                    <div style="margin-top:16px;font-size:34px;font-weight:700;color:${accent};">${formatCurrency(option.estimatedPrice)}</div>
                    <div style="margin-top:4px;font-size:12px;color:#64748b;">${formatCurrency(option.priceRangeLow)} - ${formatCurrency(option.priceRangeHigh)}</div>
                    <div style="margin-top:6px;font-size:13px;font-weight:600;color:#64748b;">${option.systemName}</div>
                    <ul style="margin:16px 0 0 18px;padding:0;color:#334155;font-size:14px;line-height:1.6;">
                      ${option.features.map((feature) => `<li>${feature}</li>`).join("")}
                    </ul>
                    ${selected?.id === option.id ? `<div style="margin-top:12px;font-size:12px;font-weight:700;color:#2f66f5;">This option is currently selected for follow-up.</div>` : ""}
                  </div>
                `;
              })
              .join("")}
          </div>
        </div>
      </body>
    </html>
  `;
}

function buildText(payload: ProposalPayload) {
  return [
    `${payload.proposal.companyName} HVAC Proposal`,
    "",
    `Customer: ${payload.draft.customerName || "Customer"}`,
    `Property: ${payload.draft.propertyAddress || "Project site"}`,
    `Customer Phone: ${payload.draft.customerPhone || "Not provided"}`,
    `Customer Email: ${payload.draft.customerEmail || "Not provided"}`,
    `Job Type: ${payload.draft.jobType}`,
    `System Type: ${payload.draft.systemType}`,
    `Existing System: ${payload.draft.existingSystemType}${payload.draft.existingSystemAge ? `, ${payload.draft.existingSystemAge}` : ""}`,
    `Fuel / Condition: ${payload.draft.existingFuelType} / ${payload.draft.existingSystemCondition}`,
    `Access / Location: ${payload.draft.accessDifficulty} / ${payload.draft.installLocation}`,
    `Comfort Notes: ${payload.draft.comfortIssues || "None noted"}`,
    `Package / Brand: ${payload.draft.equipmentPackage} / ${payload.draft.preferredBrand}`,
    `Target Margin: ${Math.max(payload.draft.targetGrossMargin, payload.pricingRules.marginFloorPercent)}%`,
    `Add-ons: ${
      [
        payload.draft.thermostatUpgrade && "Smart thermostat",
        payload.draft.iaqBundle && "IAQ bundle",
        payload.draft.surgeProtection && "Surge protection",
        payload.draft.maintenancePlan && "Maintenance plan",
        payload.draft.extendedLaborWarranty && "Extended labor warranty",
      ]
        .filter(Boolean)
        .join(", ") || "None selected"
    }`,
    `Financing: ${
      payload.draft.financingEnabled && monthlyPayment
        ? `${formatCurrency(monthlyPayment)} / month at ${payload.pricingRules.defaultFinancingApr}% APR for ${payload.draft.financingTermMonths} months`
        : "Not shown"
    }`,
    "",
    ...payload.options.flatMap((option) => [
      `${option.title} - ${option.systemName}`,
      `${formatCurrency(option.estimatedPrice)} (${formatCurrency(option.priceRangeLow)} - ${formatCurrency(option.priceRangeHigh)})`,
      option.description,
      ...option.features.map((feature) => `- ${feature}`),
      "",
    ]),
  ].join("\n");
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") ?? "quotes@send.hvacquote.pro";

    if (!resendApiKey) {
      throw new Error("Missing RESEND_API_KEY secret.");
    }

    const payload = (await request.json()) as ProposalPayload;

    if (!payload.customerEmail) {
      throw new Error("Customer email is required.");
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
        "User-Agent": "hvac-quote-ai/1.0",
      },
      body: JSON.stringify({
        from: `${payload.proposal.companyName || "HVAC Quote AI"} <${fromEmail}>`,
        to: [payload.customerEmail],
        reply_to: payload.proposal.companyEmail || undefined,
        subject: `${payload.proposal.companyName} proposal for ${payload.draft.customerName || "your project"}`,
        html: buildHtml(payload),
        text: buildText(payload),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const detailedError =
        data?.message ||
        data?.error ||
        data?.name ||
        JSON.stringify(data) ||
        "Resend send failed.";

      return new Response(JSON.stringify({ error: detailedError }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, id: data.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown email send error.";
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
