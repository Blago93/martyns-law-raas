import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as apprunner from 'aws-cdk-lib/aws-apprunner';
import * as assets from 'aws-cdk-lib/aws-ecr-assets';
import * as path from 'path';

export class RaasStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // 1. VPC: Create a VPC in eu-west-2 with public/private subnets
        console.log("Creating VPC...");
        const vpc = new ec2.Vpc(this, 'RaasVpc', {
            availabilityZones: ['eu-west-2a', 'eu-west-2b'], // Hardcode to bypass manual synth dummy-value bug
            natGateways: 1, // Minimize cost (1 NAT Gateway)
            subnetConfiguration: [
                {
                    cidrMask: 24,
                    name: 'Public',
                    subnetType: ec2.SubnetType.PUBLIC,
                },
                {
                    cidrMask: 24,
                    name: 'Private',
                    subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
                }
            ]
        });

        // Security Groups
        const appRunnerSg = new ec2.SecurityGroup(this, 'AppRunnerSG', {
            vpc,
            description: 'Security group for App Runner service',
            allowAllOutbound: true,
        });

        const dbSg = new ec2.SecurityGroup(this, 'DatabaseSG', {
            vpc,
            description: 'Security group for RDS Database',
            allowAllOutbound: true,
        });

        // Allow App Runner to access DB on 5432
        dbSg.addIngressRule(appRunnerSg, ec2.Port.tcp(5432), 'Allow Postgres from App Runner');

        // 2. RDS Database (Free Tier Eligible)
        console.log("Creating Database...");
        const database = new rds.DatabaseInstance(this, 'RaasDatabase', {
            engine: rds.DatabaseInstanceEngine.postgres({ version: rds.PostgresEngineVersion.VER_16 }),
            vpc,
            vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
            securityGroups: [dbSg],
            databaseName: 'martyns_law_db',
            credentials: rds.Credentials.fromGeneratedSecret('postgres'), // Auto-generate password
            allocatedStorage: 20,
            storageType: rds.StorageType.GP2,
            deletionProtection: false, // For easier teardown during dev
            removalPolicy: cdk.RemovalPolicy.DESTROY, // DESTROY on stack deletion
        });

        // Instance Role (for runtime secrets/Bedrock)
        const instanceRole = new iam.Role(this, 'RaasAppRunnerTaskRole', {
            assumedBy: new iam.ServicePrincipal('tasks.apprunner.amazonaws.com'),
        });

        // Grant Bedrock Access
        instanceRole.addToPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'bedrock:InvokeModel',
                'bedrock:ApplyGuardrail'
            ],
            resources: ['*'], // Allow all models for flexibility in dev
        }));

        // Access Role for ECR Pull — must trust build.apprunner.amazonaws.com (NOT tasks)
        const accessRole = new iam.Role(this, 'RaasAppRunnerECRRole', {
            assumedBy: new iam.ServicePrincipal('build.apprunner.amazonaws.com'),
            managedPolicies: [
                iam.ManagedPolicy.fromManagedPolicyArn(this, 'AppRunnerECRAccess', 'arn:aws:iam::aws:policy/service-role/AWSAppRunnerServicePolicyForECRAccess')
            ]
        });

        // 4. Docker Image Asset
        const asset = new assets.DockerImageAsset(this, 'BackendImage', {
            directory: path.join(__dirname, '../../backend'),
            platform: assets.Platform.LINUX_AMD64, // Ensure Linux build
        });

        // 5. App Runner Service
        const service = new apprunner.CfnService(this, 'RaasBackendService', {
            sourceConfiguration: {
                authenticationConfiguration: {
                    accessRoleArn: accessRole.roleArn,
                },
                imageRepository: {
                    imageIdentifier: asset.imageUri,
                    imageRepositoryType: 'ECR',
                    imageConfiguration: {
                        port: '3001',
                        runtimeEnvironmentVariables: [
                            { name: 'NODE_ENV', value: 'production' },
                            { name: 'DB_HOST', value: database.dbInstanceEndpointAddress },
                            { name: 'DB_PORT', value: database.dbInstanceEndpointPort },
                            { name: 'DB_NAME', value: 'martyns_law_db' },
                        ],
                        runtimeEnvironmentSecrets: (() => {
                            console.log("Configuring Secrets...", { secretExists: !!database.secret });
                            if (!database.secret) throw new Error("Database secret is undefined!");
                            // App Runner runtimeEnvironmentSecrets only accepts plain secret ARN (no :fieldname suffix)
                            // Backend must parse the JSON secret to extract username/password
                            return [{ name: 'DB_SECRET', value: database.secret.secretArn }];
                        })()
                    }
                },
                autoDeploymentsEnabled: true,
            },
            instanceConfiguration: {
                instanceRoleArn: instanceRole.roleArn,
                cpu: '1 vCPU',
                memory: '2 GB',
            },
            networkConfiguration: {
                egressConfiguration: {
                    egressType: 'VPC',
                    vpcConnectorArn: new apprunner.CfnVpcConnector(this, 'VpcConnector', {
                        subnets: vpc.privateSubnets.map(s => s.subnetId),
                        securityGroups: [appRunnerSg.securityGroupId],
                    }).attrVpcConnectorArn,
                }
            }
        });

        // Grant Secret Read Access to App Runner
        database.secret?.grantRead(instanceRole);

        // Outputs
        new cdk.CfnOutput(this, 'AppRunnerUrl', {
            value: `https://${service.attrServiceUrl}`,
        });
        new cdk.CfnOutput(this, 'DatabaseEndpoint', {
            value: database.dbInstanceEndpointAddress,
        });
        new cdk.CfnOutput(this, 'DatabaseSecretArn', {
            value: database.secret?.secretArn || 'No Secret Created',
        });

    }
}
