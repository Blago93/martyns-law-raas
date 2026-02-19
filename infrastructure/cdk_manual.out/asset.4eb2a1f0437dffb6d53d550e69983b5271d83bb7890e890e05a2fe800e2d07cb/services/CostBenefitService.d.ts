interface VulnerabilityReport {
    vulnerabilityId: string;
    description: string;
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
export declare class CostBenefitService {
    private bedrockClient;
    constructor();
    /**
     * Estimates cost and risk if not provided, then evaluates standard.
     */
    evaluateMeasure(report: VulnerabilityReport): Promise<AssessmentResult>;
    private estimateParameters;
    private generateCertificate;
}
export {};
