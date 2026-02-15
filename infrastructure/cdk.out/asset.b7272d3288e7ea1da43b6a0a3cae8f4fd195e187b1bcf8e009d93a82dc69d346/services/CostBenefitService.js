const fs = require('fs');
const path = require('path');
const { BedrockRuntimeClient, InvokeModelCommand } = require("@aws-sdk/client-bedrock-runtime");

const VPF = 2400000.0; // Value of Preventing a Fatality
const GDF = 10.0;      // Gross Disproportion Factor

class CostBenefitService {
    constructor() {
        this.client = new BedrockRuntimeClient({ region: "eu-west-2" });
        this.smtPolicy = fs.readFileSync(path.join(__dirname, '../../intelligence/policy.smt2'), 'utf8');
    }

    async verifyMeasure(measureCost, riskReduction, venueContext) {
        // 1. Local Pre-Calculation (Fast Fail)
        const monetizedBenefit = riskReduction * VPF;
        const threshold = monetizedBenefit * GDF;
        const isMandatoryMath = measureCost <= threshold;

        // 2. Bedrock "Automated Reasoning" Simulation
        // We inject the SMT policy and the specific variables to get a "Proof" explanation.
        const prompt = `
You are the Martyn's Law Compliance Engine.
You must verify if a security measure is "Reasonably Practicable" based on the provided SMT-LIB 2.0 policy.

--- POLICY START ---
${this.smtPolicy}
--- POLICY END ---

CONTEXT:
Venue Capacity: ${venueContext.capacity} (Standard Tier: 200-799)
Measure Cost: £${measureCost}
Baseline Risk: ${venueContext.baselineRisk}
Residual Risk: ${venueContext.residualRisk}
Risk Reduction: ${riskReduction}

INSTRUCTIONS:
1. Execute the logic defined in the SMT-LIB policy.
2. Determine if the measure is MANDATORY or OPTIONAL.
3. Provide a "Legal Proof" explanation citing the Gross Disproportion Factor (GDF).

OUTPUT JSON FORMAT:
{
    "measure_cost": number,
    "disproportion_threshold": number,
    "status": "REQUIRED" | "OPTIONAL",
    "gdf_calculated": number,
    "reasoning": "string"
}
`;

        try {
            const result = await this.client.send(new InvokeModelCommand({
                modelId: "anthropic.claude-3-5-sonnet-20240620-v1:0",
                contentType: "application/json",
                accept: "application/json",
                body: JSON.stringify({
                    anthropic_version: "bedrock-2023-05-31",
                    max_tokens: 1000,
                    messages: [
                        { role: "user", content: prompt }
                    ]
                })
            }));

            const response = JSON.parse(new TextDecoder().decode(result.body));
            return JSON.parse(response.content[0].text);

        } catch (error) {
            console.error("Bedrock Logic Error:", error);
            // Fallback to local math if Bedrock fails
            return {
                measure_cost: measureCost,
                disproportion_threshold: threshold,
                status: isMandatoryMath ? "REQUIRED" : "OPTIONAL",
                gdf_calculated: measureCost / monetizedBenefit,
                reasoning: "Fallback calculation: Logic Engine unavailable."
            };
        }
    }
}

module.exports = new CostBenefitService();
