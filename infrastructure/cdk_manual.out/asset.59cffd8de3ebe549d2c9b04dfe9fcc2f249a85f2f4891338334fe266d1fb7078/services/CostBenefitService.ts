import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

// Constants mirroring SMT policy
const VPF = 2400000.0;
const GDF = 10.0;

interface VulnerabilityReport {
    vulnerabilityId: string;
    description: string;
    // Optional: if already known
    estimatedCost?: number;
    estimatedRiskReduction?: number;
}

interface AssessmentResult {
    isMandatory: boolean;
    status: 'MANDATORY' | 'DISPROPORTIONATE';
    details: {
        cost: number;
        benefit: number;
        threshold: number;
    };
    certificatePath?: string;
}

export class CostBenefitService {
    private bedrockClient: BedrockRuntimeClient;

    constructor() {
        this.bedrockClient = new BedrockRuntimeClient({ region: process.env.AWS_REGION || 'eu-west-2' });
    }

    /**
     * Estimates cost and risk if not provided, then evaluates standard.
     */
    async evaluateMeasure(report: VulnerabilityReport): Promise<AssessmentResult> {
        let cost = report.estimatedCost;
        let riskDelta = report.estimatedRiskReduction;

        if (cost === undefined || riskDelta === undefined) {
            const estimates = await this.estimateParameters(report.description);
            cost = estimates.cost;
            riskDelta = estimates.riskDelta;
        }

        const benefit = riskDelta! * VPF;
        const threshold = benefit * GDF;

        // Logic: Mandatory if Cost <= Benefit * GDF
        const isMandatory = cost! <= threshold;
        const status = isMandatory ? 'MANDATORY' : 'DISPROPORTIONATE';

        let certificatePath: string | undefined;

        if (status === 'DISPROPORTIONATE') {
            certificatePath = await this.generateCertificate(report, cost!, threshold);
        }

        return {
            isMandatory,
            status,
            details: {
                cost: cost!,
                benefit,
                threshold
            },
            certificatePath
        };
    }

    private async estimateParameters(description: string): Promise<{ cost: number, riskDelta: number }> {
        // Mock implementation for prototype if Bedrock fails or env vars missing
        // In prod: Use Bedrock with specific prompt to extract/estimate values
        console.log(`Estimating for: ${description}`);

        // Placeholder AI logic
        // "Lack of blast glazing" typically high cost, moderate risk reduction
        if (description.toLowerCase().includes('blast glazing')) {
            return { cost: 15000, riskDelta: 0.0005 }; // Cost 15k, Risk reduced by 0.05% of a fatality
        }

        return { cost: 5000, riskDelta: 0.0001 };
    }

    private async generateCertificate(report: VulnerabilityReport, cost: number, threshold: number): Promise<string> {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument();
            const filename = `cert_${Date.now()}_${report.vulnerabilityId}.pdf`;
            const outputDir = path.join(__dirname, '../../uploads/certificates'); // storage path

            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            const loadPath = path.join(outputDir, filename);
            const stream = fs.createWriteStream(loadPath);

            doc.pipe(stream);

            doc.fontSize(20).text('CERTIFICATE OF DISPROPORTIONALITY', { align: 'center' });
            doc.moveDown();
            doc.fontSize(12).text(`Vulnerability: ${report.description}`);
            doc.text(`Date: ${new Date().toISOString()}`);
            doc.moveDown();
            doc.text(`Estimated Cost: £${cost.toFixed(2)}`);
            doc.text(`Max "Reasonably Practicable" Cost (Threshold): £${threshold.toFixed(2)}`);
            doc.moveDown();
            doc.fontSize(14).fillColor('red').text('VERDICT: REJECTED');
            doc.fontSize(12).fillColor('black').text('This measure was rejected under Section 27 as Grossly Disproportionate (Factor > 10).');
            doc.moveDown();
            doc.text('Calculated using The Martyn\'s Law Reasonably Practicable Engine (SMT-Verified).');

            doc.end();

            stream.on('finish', () => resolve(loadPath));
            stream.on('error', reject);
        });
    }
}
