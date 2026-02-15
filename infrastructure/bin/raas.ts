#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { RaasStack } from '../lib/raas-stack';

const app = new cdk.App();
new RaasStack(app, 'MartynsLawRaasStack', {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: 'eu-west-2' // Mandated by limitations
    },
});
