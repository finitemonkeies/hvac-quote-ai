const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function safeText(value: string | null | undefined, fallback = "") {
  return escapeHtml((value ?? fallback).trim() || fallback);
}

function renderMetaRow(label: string, value: string) {
  return `
    <tr>
      <td style="padding:0 0 10px 0;font-size:14px;line-height:20px;color:#334155;">
        <span style="font-weight:700;color:#0f172a;">${escapeHtml(label)}:</span> ${value}
      </td>
    </tr>
  `;
}

function renderOptionCard(option: QuoteOption, selectedId: string | null) {
  const borderColor = option.isRecommended ? "#2f66f5" : "#d7e2f0";
  const titleColor = option.isRecommended ? "#1d4ed8" : "#0f172a";
  const badge = option.isRecommended
    ? `
      <div style="margin:8px 0 0 0;">
        <span style="display:inline-block;background:#dbeafe;color:#1d4ed8;border:1px solid #93c5fd;border-radius:999px;padding:4px 10px;font-size:11px;line-height:16px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;">
          Recommended
        </span>
      </div>
    `
    : "";
  const selectedNote =
    selectedId === option.id
      ? `
        <tr>
          <td style="padding:14px 0 0 0;font-size:12px;line-height:18px;font-weight:700;color:#2563eb;">
            This option is currently selected for follow-up.
          </td>
        </tr>
      `
      : "";

  return `
    <tr>
      <td style="padding:0 0 16px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;border:1px solid ${borderColor};border-radius:20px;">
          <tr>
            <td style="padding:20px 20px 18px 20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:0;font-size:28px;line-height:34px;font-weight:800;color:${titleColor};">
                    ${escapeHtml(option.title)}
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0 0 0;font-size:14px;line-height:21px;color:#475569;">
                    ${safeText(option.description)}
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 0 0 0;font-size:42px;line-height:46px;font-weight:800;color:${titleColor};">
                    ${formatCurrency(option.estimatedPrice)}
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0 0 0;font-size:13px;line-height:18px;color:#64748b;">
                    ${formatCurrency(option.priceRangeLow)} - ${formatCurrency(option.priceRangeHigh)}
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0 0 0;font-size:14px;line-height:20px;font-weight:600;color:#334155;">
                    ${safeText(option.systemName)}
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 0 0 0;">
                    <ul style="margin:0;padding-left:20px;color:#1f2937;font-size:14px;line-height:22px;">
                      ${option.features.map((feature) => `<li style="margin:0 0 6px 0;">${safeText(feature)}</li>`).join("")}
                    </ul>
                  </td>
                </tr>
                <tr>
                  <td>${badge}</td>
                </tr>
                ${selectedNote}
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
}

async function requireAuthenticatedUser(request: Request) {
  const authorization = request.headers.get("Authorization") ?? request.headers.get("authorization");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!authorization?.startsWith("Bearer ")) {
    throw new Response(JSON.stringify({ error: "Missing authorization token." }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Response(JSON.stringify({ error: "Missing Supabase auth configuration." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    method: "GET",
    headers: {
      apikey: supabaseAnonKey,
      Authorization: authorization,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Response(JSON.stringify({ error: errorText || "Invalid auth token." }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
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
  const contactLine = [payload.proposal.companyPhone, payload.proposal.companyEmail].filter(Boolean).map((value) => safeText(value)).join(" | ");
  const introName = safeText(payload.draft.customerName, "there");
  const projectAddress = safeText(payload.draft.propertyAddress, "your project location");
  const existingSystem = `${safeText(payload.draft.existingSystemType, "Existing system")}${
    payload.draft.existingSystemAge ? `, ${safeText(payload.draft.existingSystemAge)}` : ""
  }`;
  const financingLine =
    payload.draft.financingEnabled && monthlyPayment
      ? `${formatCurrency(monthlyPayment)} / month at ${payload.pricingRules.defaultFinancingApr}% APR for ${payload.draft.financingTermMonths} months`
      : "Financing details not shown";

  return `
    <html>
      <body style="margin:0;padding:0;background:#eef3f9;font-family:Arial,sans-serif;color:#0f172a;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;background:#eef3f9;">
          <tr>
            <td align="center" style="padding:24px 12px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:720px;width:100%;background:#ffffff;border:1px solid #dbe2ea;border-radius:24px;">
                <tr>
                  <td style="padding:28px 28px 22px 28px;border-bottom:1px solid #e2e8f0;">
                    <div style="font-size:32px;line-height:36px;font-weight:800;color:#0f172a;">${safeText(payload.proposal.companyName, "HVAC Quote AI")}</div>
                    ${contactLine ? `<div style="margin-top:8px;font-size:14px;line-height:20px;color:#2563eb;">${contactLine}</div>` : ""}
                    ${
                      payload.proposal.companyLicense
                        ? `<div style="margin-top:6px;font-size:13px;line-height:18px;color:#64748b;">${safeText(payload.proposal.companyLicense)}</div>`
                        : ""
                    }
                  </td>
                </tr>
                <tr>
                  <td style="padding:24px 28px 12px 28px;">
                    <div style="font-size:24px;line-height:30px;font-weight:800;color:#0f172a;">Your HVAC proposal</div>
                    <div style="margin-top:8px;font-size:15px;line-height:24px;color:#334155;">
                      Hello ${introName},<br />
                      Please review your install options for ${projectAddress}. Reply to this email or call us with any questions.
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 28px 8px 28px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;background:#f8fbff;border:1px solid #d7e2f0;border-radius:18px;">
                      <tr>
                        <td style="padding:18px 20px;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                            ${renderMetaRow(
                              "Contact on file",
                              `${safeText(payload.draft.customerPhone, "No phone provided")}${payload.draft.customerPhone && payload.draft.customerEmail ? " | " : ""}${safeText(payload.draft.customerEmail)}`,
                            )}
                            ${renderMetaRow(
                              "Existing equipment",
                              `${existingSystem} | ${safeText(payload.draft.existingFuelType)} | ${safeText(payload.draft.existingSystemCondition)}`,
                            )}
                            ${renderMetaRow(
                              "Install conditions",
                              `${safeText(payload.draft.accessDifficulty)} | ${safeText(payload.draft.installLocation)}`,
                            )}
                            ${renderMetaRow(
                              "Package / brand",
                              `${safeText(payload.draft.equipmentPackage)} | ${safeText(payload.draft.preferredBrand)}`,
                            )}
                            ${renderMetaRow("Selected add-ons", safeText(selectedAddOns))}
                            ${renderMetaRow("Estimated financing", financingLine)}
                            ${
                              payload.draft.comfortIssues
                                ? renderMetaRow("Comfort notes", safeText(payload.draft.comfortIssues))
                                : ""
                            }
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 28px 28px 28px;">
                    <div style="padding:0 0 14px 0;font-size:18px;line-height:24px;font-weight:800;color:#0f172a;">
                      Proposal options
                    </div>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;">
                      ${payload.options.map((option) => renderOptionCard(option, selected?.id ?? null)).join("")}
                    </table>
                    <div style="padding-top:8px;font-size:13px;line-height:20px;color:#64748b;">
                      Pricing reflects the scope and assumptions discussed on site. Reply to this email if you would like to adjust equipment, accessories, or financing.
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

function buildText(payload: ProposalPayload) {
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
    await requireAuthenticatedUser(request);

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") ?? "quotes@hvacquote.pro";

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
    if (error instanceof Response) {
      return error;
    }

    const message = error instanceof Error ? error.message : "Unknown email send error.";
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
