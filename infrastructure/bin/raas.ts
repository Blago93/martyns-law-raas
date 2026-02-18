#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { RaasStack } from '../lib/raas-stack';

console.log("Starting CDK App...");
try {
    const app = new cdk.App({ outdir: 'cdk_manual.out' });
    new RaasStack(app, 'MartynsLawRaasStack', {
        env: {
            account: process.env.CDK_DEFAULT_ACCOUNT,
            region: 'eu-west-2' // Mandated by limitations
        },
    });

    app.synth();
    console.log("Stack synthesis complete.");
} catch (e) {
    console.error("FATAL ERROR:", e);
    process.exit(1);
}
