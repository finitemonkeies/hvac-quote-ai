# HVAC Quote AI Build Checklist

## Working Thesis
- Help HVAC technicians create fast, professional, on-site quotes that can be customized, saved, and sent before they leave the driveway.

## Success Criteria
- A technician can create a quote in a few minutes on mobile.
- The quote feels branded and trustworthy to the homeowner.
- Good / Better / Best options are easy to compare and explain.
- Work is not lost if the app reloads or connectivity is spotty.
- Quotes can be saved, reopened, exported, and sent through real delivery channels.

## Product Checklist
- Intake flow captures the customer, property, and job context needed for a real quote.
- Pricing inputs support labor, materials, equipment tier, and field adjustments.
- Proposal defaults come from a persistent company profile instead of re-entry on every quote.
- Generated options can be refined before presenting to the homeowner.
- Recent estimates sync to the logged-in user account.
- Email delivery works with production credentials and a verified sending domain.
- PDF export produces a clean customer-facing proposal.
- Auth, empty states, and error states are clear enough for non-technical field users.

## Highest-Priority Gaps
- Add a durable company profile / settings flow for proposal defaults.
- Expand intake for customer contact and job-site details.
- Add stronger proposal output and delivery reliability.
- Document environment and deployment steps for Supabase, OpenAI, and email.

## Next Build Order
1. Company profile setup and persistent proposal defaults.
2. Customer contact capture and better job intake.
3. Proposal output improvements and delivery hardening.
4. Performance pass, route splitting, and launch polish.
