import { useEffect, useState } from "react";
import { Mail, MessageSquare, Printer, Share2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { StepHeader } from "../components/StepHeader";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useEstimate } from "../lib/estimate-store";
import { downloadProposalPdf, shareProposal } from "../services/export";
import { sendProposalEmailViaSupabase } from "../services/supabase";

export function Send() {
  const navigate = useNavigate();
  const { approvalNote, approvalStatus, draft, options, pricingRules, proposal, selectedOptionId, saveEstimate } =
    useEstimate();
  const [email, setEmail] = useState(draft.customerEmail);
  const [phone, setPhone] = useState(draft.customerPhone);
  const [status, setStatus] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  useEffect(() => {
    if (options.length === 0) {
      navigate("/input");
    }
  }, [navigate, options.length]);

  useEffect(() => {
    setEmail((current) => current || draft.customerEmail);
  }, [draft.customerEmail]);

  useEffect(() => {
    setPhone((current) => current || draft.customerPhone);
  }, [draft.customerPhone]);

  const selected = options.find((option) => option.id === selectedOptionId) ?? options[1] ?? options[0];
  if (!selected) {
    return null;
  }
  const requiresApproval = selected.policyStatus === "needs-approval";
  const canDeliver = !requiresApproval || approvalStatus === "approved";

  const encodedSummary = encodeURIComponent(
    `${proposal.companyName} proposal for ${draft.customerName || "your project"}: ${selected.systemName} at ${selected.estimatedPrice}.`,
  );

  return (
    <AppShell>
      <StepHeader title="Send / Export" subtitle="Finish" backTo="/preview" />

      <div className="space-y-4">
        {requiresApproval ? (
          <Card className="rounded-[28px] border-amber-200 bg-amber-50 p-5">
            <p className="font-semibold text-amber-950">Approval required before delivery</p>
            <p className="mt-1 text-sm text-amber-800">{selected.policyReason}</p>
            <p className="mt-2 text-sm text-amber-800">
              {approvalStatus === "approved"
                ? `Approved${approvalNote ? `: ${approvalNote}` : "."}`
                : "Mark this quote approved on the preview screen before sending or sharing it."}
            </p>
          </Card>
        ) : null}

        <Card className="rounded-[28px] border-slate-200 bg-white/90 p-5">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
              <Mail className="size-5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-950">Email proposal</p>
              <p className="mt-1 text-sm text-slate-600">
                Sends a real proposal email from your verified domain and uses the company email as reply-to.
              </p>
              <Label htmlFor="email" className="mt-4 block text-sm">
                Customer email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 h-12 rounded-2xl border-slate-200 bg-slate-50"
              />
              <Button
                className="mt-4 h-12 w-full rounded-full bg-slate-950 text-white hover:bg-slate-800"
                onClick={async () => {
                  setIsSendingEmail(true);
                  setStatus("");

                  try {
                    await saveEstimate("email");
                    await sendProposalEmailViaSupabase({
                      customerEmail: email,
                      draft,
                      pricingRules,
                      proposal,
                      options,
                      selectedOptionId,
                    });
                    setStatus("Proposal email sent.");
                  } catch (error) {
                    const message =
                      error instanceof Error ? error.message : "Failed to send proposal email.";
                    setStatus(message);
                  } finally {
                    setIsSendingEmail(false);
                  }
                }}
                disabled={!email || isSendingEmail || !canDeliver}
              >
                {isSendingEmail ? "Sending..." : "Send by Email"}
              </Button>
            </div>
          </div>
        </Card>

        <Card className="rounded-[28px] border-slate-200 bg-white/90 p-5">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
              <MessageSquare className="size-5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-950">SMS follow-up</p>
              <p className="mt-1 text-sm text-slate-600">
                Sends a quick text summary using the device messaging app.
              </p>
              <Label htmlFor="phone" className="mt-4 block text-sm">
                Customer phone
              </Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="mt-2 h-12 rounded-2xl border-slate-200 bg-slate-50"
              />
              <Button
                className="mt-4 h-12 w-full rounded-full bg-emerald-600 text-white hover:bg-emerald-500"
                onClick={async () => {
                  await saveEstimate("sms");
                  window.location.href = `sms:${phone}?body=${encodedSummary}`;
                  setStatus("Opened messaging app.");
                }}
                disabled={!phone || !canDeliver}
              >
                Send by Text
              </Button>
            </div>
          </div>
        </Card>

        <Card className="rounded-[28px] border-slate-200 bg-white/90 p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Button
              variant="outline"
              className="h-12 rounded-full border-slate-300"
              onClick={async () => {
                await saveEstimate("download");
                downloadProposalPdf(draft, pricingRules, proposal, options, selectedOptionId);
                setStatus("Opened print dialog for PDF export.");
              }}
              disabled={!canDeliver}
            >
              <Printer className="size-4" />
              Download PDF
            </Button>
            <Button
              variant="outline"
              className="h-12 rounded-full border-slate-300"
              onClick={async () => {
                const shared = await shareProposal(draft, options, selectedOptionId);
                if (shared) {
                  await saveEstimate("share");
                  setStatus("Shared proposal.");
                  return;
                }

                setStatus("Share is not available on this device.");
              }}
              disabled={!canDeliver}
            >
              <Share2 className="size-4" />
              Share
            </Button>
          </div>
        </Card>
      </div>

      {status ? <p className="mt-4 text-center text-sm text-slate-600">{status}</p> : null}

      <Button
        variant="ghost"
        className="mt-6 h-12 w-full rounded-full text-slate-700"
        onClick={() => navigate("/")}
      >
        Back Home
      </Button>
    </AppShell>
  );
}
