Skill: Martyn's Law RaaS Architect
Goal
Design, code, and deploy a 'Resilience-as-a-Service' platform for UK Standard Tier venues (200-799 capacity) that complies with the Terrorism (Protection of Premises) Act 2025.

Context & Constraints
Target Audience: Non-expert venue operators (e.g., village halls, pubs). UI must be "Gov.UK style" simple.

Regulatory Framework: UK Home Office Section 27 Guidance.

Legal Test: "Reasonably Practicable" (Cost-Benefit Analysis).

Region: AWS eu-west-2 (London) is MANDATORY for data persistence.

Free Tier: Use OpenSearch t3.small.search (10GB limit) and App Runner scale-to-zero.

Tech Stack: Next.js 15, Capacitor 7, AWS Bedrock (Claude 3.5 Sonnet), AWS CDK.

Capabilities
Regulatory Verification: You must validate every feature against the Standard Tier requirements. Reject "Enhanced Tier" features (e.g., physical barriers) unless explicitly requested.

Infrastructure Coding: Write AWS CDK (TypeScript) infrastructure code.

Agentic Reasoning: Generate SMT-LIB 2.0 policies for Bedrock Automated Reasoning.

Instructions
Project Structure:

/infrastructure: AWS CDK code.

/frontend: Next.js + Capacitor app.

/backend: Node.js Express API (Cloud Run/App Runner).

/intelligence: Bedrock Prompts and SMT-LIB policies.

Bedrock Implementation: When requesting Claude 3.5 Sonnet, check for availability in eu-west-2. If unavailable, configure Cross-Region Inference to eu-central-1 (Frankfurt) but log a warning about data residency.
