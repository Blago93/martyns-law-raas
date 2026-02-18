"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RaasStack = void 0;
const cdk = require("aws-cdk-lib");
const ec2 = require("aws-cdk-lib/aws-ec2");
const rds = require("aws-cdk-lib/aws-rds");
const iam = require("aws-cdk-lib/aws-iam");
const apprunner = require("aws-cdk-lib/aws-apprunner");
const assets = require("aws-cdk-lib/aws-ecr-assets");
const path = require("path");
class RaasStack extends cdk.Stack {
    constructor(scope, id, props) {
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
                            if (!database.secret)
                                throw new Error("Database secret is undefined!");
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
exports.RaasStack = RaasStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmFhcy1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInJhYXMtc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsbUNBQW1DO0FBRW5DLDJDQUEyQztBQUMzQywyQ0FBMkM7QUFDM0MsMkNBQTJDO0FBQzNDLHVEQUF1RDtBQUN2RCxxREFBcUQ7QUFDckQsNkJBQTZCO0FBRTdCLE1BQWEsU0FBVSxTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBQ3BDLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBc0I7UUFDNUQsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsZ0VBQWdFO1FBQ2hFLE9BQU8sQ0FBQyxHQUFHLENBQUMsaUJBQWlCLENBQUMsQ0FBQztRQUMvQixNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLFNBQVMsRUFBRTtZQUNyQyxpQkFBaUIsRUFBRSxDQUFDLFlBQVksRUFBRSxZQUFZLENBQUMsRUFBRSxrREFBa0Q7WUFDbkcsV0FBVyxFQUFFLENBQUMsRUFBRSxnQ0FBZ0M7WUFDaEQsbUJBQW1CLEVBQUU7Z0JBQ2pCO29CQUNJLFFBQVEsRUFBRSxFQUFFO29CQUNaLElBQUksRUFBRSxRQUFRO29CQUNkLFVBQVUsRUFBRSxHQUFHLENBQUMsVUFBVSxDQUFDLE1BQU07aUJBQ3BDO2dCQUNEO29CQUNJLFFBQVEsRUFBRSxFQUFFO29CQUNaLElBQUksRUFBRSxTQUFTO29CQUNmLFVBQVUsRUFBRSxHQUFHLENBQUMsVUFBVSxDQUFDLG1CQUFtQjtpQkFDakQ7YUFDSjtTQUNKLENBQUMsQ0FBQztRQUVILGtCQUFrQjtRQUNsQixNQUFNLFdBQVcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxhQUFhLENBQUMsSUFBSSxFQUFFLGFBQWEsRUFBRTtZQUMzRCxHQUFHO1lBQ0gsV0FBVyxFQUFFLHVDQUF1QztZQUNwRCxnQkFBZ0IsRUFBRSxJQUFJO1NB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O2dCQUNuQixlQUFlLEVBQUUsWUFBWSxDQUFDLE9BQU87Z0JBQ3JDLEdBQUcsRUFBRSxRQUFRO2dCQUNiLE1BQU0sRUFBRSxNQUFNO2FBQ2pCO1lBQ0Qsb0JBQW9CLEVBQUU7Z0JBQ2xCLG1CQUFtQixFQUFFO29CQUNqQixVQUFVLEVBQUUsS0FBSztvQkFDakIsZUFBZSxFQUFFLElBQUksU0FBUyxDQUFDLGVBQWUsQ0FBQyxJQUFJLEVBQUUsY0FBYyxFQUFFO3dCQUNqRSxPQUFPLEVBQUUsR0FBRyxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDO3dCQUNoRCxjQUFjLEVBQUUsQ0FBQyxXQUFXLENBQUMsZUFBZSxDQUFDO3FCQUNoRCxDQUFDLENBQUMsbUJBQW1CO2lCQUN6QjthQUNKO1NBQ0osQ0FBQyxDQUFDO1FBRUgseUNBQXlDO1FBQ3pDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBRXpDLFVBQVU7UUFDVixJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLGNBQWMsRUFBRTtZQUNwQyxLQUFLLEVBQUUsV0FBVyxPQUFPLENBQUMsY0FBYyxFQUFFO1NBQzdDLENBQUMsQ0FBQztRQUNILElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsa0JBQWtCLEVBQUU7WUFDeEMsS0FBSyxFQUFFLFFBQVEsQ0FBQyx5QkFBeUI7U0FDNUMsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxtQkFBbUIsRUFBRTtZQUN6QyxLQUFLLEVBQUUsUUFBUSxDQUFDLE1BQU0sRUFBRSxTQUFTLElBQUksbUJBQW1CO1NBQzNELENBQUMsQ0FBQztJQUVQLENBQUM7Q0FDSjtBQS9JRCw4QkErSUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xyXG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcclxuaW1wb3J0ICogYXMgZWMyIGZyb20gJ2F3cy1jZGstbGliL2F3cy1lYzInO1xyXG5pbXBvcnQgKiBhcyByZHMgZnJvbSAnYXdzLWNkay1saWIvYXdzLXJkcyc7XHJcbmltcG9ydCAqIGFzIGlhbSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtaWFtJztcclxuaW1wb3J0ICogYXMgYXBwcnVubmVyIGZyb20gJ2F3cy1jZGstbGliL2F3cy1hcHBydW5uZXInO1xyXG5pbXBvcnQgKiBhcyBhc3NldHMgZnJvbSAnYXdzLWNkay1saWIvYXdzLWVjci1hc3NldHMnO1xyXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xyXG5cclxuZXhwb3J0IGNsYXNzIFJhYXNTdGFjayBleHRlbmRzIGNkay5TdGFjayB7XHJcbiAgICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wcz86IGNkay5TdGFja1Byb3BzKSB7XHJcbiAgICAgICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XHJcblxyXG4gICAgICAgIC8vIDEuIFZQQzogQ3JlYXRlIGEgVlBDIGluIGV1LXdlc3QtMiB3aXRoIHB1YmxpYy9wcml2YXRlIHN1Ym5ldHNcclxuICAgICAgICBjb25zb2xlLmxvZyhcIkNyZWF0aW5nIFZQQy4uLlwiKTtcclxuICAgICAgICBjb25zdCB2cGMgPSBuZXcgZWMyLlZwYyh0aGlzLCAnUmFhc1ZwYycsIHtcclxuICAgICAgICAgICAgYXZhaWxhYmlsaXR5Wm9uZXM6IFsnZXUtd2VzdC0yYScsICdldS13ZXN0LTJiJ10sIC8vIEhhcmRjb2RlIHRvIGJ5cGFzcyBtYW51YWwgc3ludGggZHVtbXktdmFsdWUgYnVnXHJcbiAgICAgICAgICAgIG5hdEdhdGV3YXlzOiAxLCAvLyBNaW5pbWl6ZSBjb3N0ICgxIE5BVCBHYXRld2F5KVxyXG4gICAgICAgICAgICBzdWJuZXRDb25maWd1cmF0aW9uOiBbXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2lkck1hc2s6IDI0LFxyXG4gICAgICAgICAgICAgICAgICAgIG5hbWU6ICdQdWJsaWMnLFxyXG4gICAgICAgICAgICAgICAgICAgIHN1Ym5ldFR5cGU6IGVjMi5TdWJuZXRUeXBlLlBVQkxJQyxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2lkck1hc2s6IDI0LFxyXG4gICAgICAgICAgICAgICAgICAgIG5hbWU6ICdQcml2YXRlJyxcclxuICAgICAgICAgICAgICAgICAgICBzdWJuZXRUeXBlOiBlYzIuU3VibmV0VHlwZS5QUklWQVRFX1dJVEhfRUdSRVNTLFxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBdXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIFNlY3VyaXR5IEdyb3Vwc1xyXG4gICAgICAgIGNvbnN0IGFwcFJ1bm5lclNnID0gbmV3IGVjMi5TZWN1cml0eUdyb3VwKHRoaXMsICdBcHBSdW5uZXJTRycsIHtcclxuICAgICAgICAgICAgdnBjLFxyXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1NlY3VyaXR5IGdyb3VwIGZvciBBcHAgUnVubmVyIHNlcnZpY2UnLFxyXG4gICAgICAgICAgICBhbGxvd0FsbE91dGJvdW5kOiB0cnVlLFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBjb25zdCBkYlNnID0gbmV3IGVjMi5TZWN1cml0eUdyb3VwKHRoaXMsICdEYXRhYmFzZVNHJywge1xyXG4gICAgICAgICAgICB2cGMsXHJcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnU2VjdXJpdHkgZ3JvdXAgZm9yIFJEUyBEYXRhYmFzZScsXHJcbiAgICAgICAgICAgIGFsbG93QWxsT3V0Ym91bmQ6IHRydWUsXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIEFsbG93IEFwcCBSdW5uZXIgdG8gYWNjZXNzIERCIG9uIDU0MzJcclxuICAgICAgICBkYlNnLmFkZEluZ3Jlc3NSdWxlKGFwcFJ1bm5lclNnLCBlYzIuUG9ydC50Y3AoNTQzMiksICdBbGxvdyBQb3N0Z3JlcyBmcm9tIEFwcCBSdW5uZXInKTtcclxuXHJcbiAgICAgICAgLy8gMi4gUkRTIERhdGFiYXNlIChGcmVlIFRpZXIgRWxpZ2libGUpXHJcbiAgICAgICAgY29uc29sZS5sb2coXCJDcmVhdGluZyBEYXRhYmFzZS4uLlwiKTtcclxuICAgICAgICBjb25zdCBkYXRhYmFzZSA9IG5ldyByZHMuRGF0YWJhc2VJbnN0YW5jZSh0aGlzLCAnUmFhc0RhdGFiYXNlJywge1xyXG4gICAgICAgICAgICBlbmdpbmU6IHJkcy5EYXRhYmFzZUluc3RhbmNlRW5naW5lLnBvc3RncmVzKHsgdmVyc2lvbjogcmRzLlBvc3RncmVzRW5naW5lVmVyc2lvbi5WRVJfMTYgfSksXHJcbiAgICAgICAgICAgIHZwYyxcclxuICAgICAgICAgICAgdnBjU3VibmV0czogeyBzdWJuZXRUeXBlOiBlYzIuU3VibmV0VHlwZS5QUklWQVRFX1dJVEhfRUdSRVNTIH0sXHJcbiAgICAgICAgICAgIGluc3RhbmNlVHlwZTogZWMyLkluc3RhbmNlVHlwZS5vZihlYzIuSW5zdGFuY2VDbGFzcy5UMywgZWMyLkluc3RhbmNlU2l6ZS5NSUNSTyksXHJcbiAgICAgICAgICAgIHNlY3VyaXR5R3JvdXBzOiBbZGJTZ10sXHJcbiAgICAgICAgICAgIGRhdGFiYXNlTmFtZTogJ21hcnR5bnNfbGF3X2RiJyxcclxuICAgICAgICAgICAgY3JlZGVudGlhbHM6IHJkcy5DcmVkZW50aWFscy5mcm9tR2VuZXJhdGVkU2VjcmV0KCdwb3N0Z3JlcycpLCAvLyBBdXRvLWdlbmVyYXRlIHBhc3N3b3JkXHJcbiAgICAgICAgICAgIGFsbG9jYXRlZFN0b3JhZ2U6IDIwLFxyXG4gICAgICAgICAgICBzdG9yYWdlVHlwZTogcmRzLlN0b3JhZ2VUeXBlLkdQMixcclxuICAgICAgICAgICAgZGVsZXRpb25Qcm90ZWN0aW9uOiBmYWxzZSwgLy8gRm9yIGVhc2llciB0ZWFyZG93biBkdXJpbmcgZGV2XHJcbiAgICAgICAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LkRFU1RST1ksIC8vIERFU1RST1kgb24gc3RhY2sgZGVsZXRpb25cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gSW5zdGFuY2UgUm9sZSAoZm9yIHJ1bnRpbWUgc2VjcmV0cy9CZWRyb2NrKVxyXG4gICAgICAgIGNvbnN0IGluc3RhbmNlUm9sZSA9IG5ldyBpYW0uUm9sZSh0aGlzLCAnUmFhc0FwcFJ1bm5lclRhc2tSb2xlJywge1xyXG4gICAgICAgICAgICBhc3N1bWVkQnk6IG5ldyBpYW0uU2VydmljZVByaW5jaXBhbCgndGFza3MuYXBwcnVubmVyLmFtYXpvbmF3cy5jb20nKSxcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gR3JhbnQgQmVkcm9jayBBY2Nlc3NcclxuICAgICAgICBpbnN0YW5jZVJvbGUuYWRkVG9Qb2xpY3kobmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xyXG4gICAgICAgICAgICBlZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXHJcbiAgICAgICAgICAgIGFjdGlvbnM6IFtcclxuICAgICAgICAgICAgICAgICdiZWRyb2NrOkludm9rZU1vZGVsJyxcclxuICAgICAgICAgICAgICAgICdiZWRyb2NrOkFwcGx5R3VhcmRyYWlsJ1xyXG4gICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICByZXNvdXJjZXM6IFsnKiddLCAvLyBBbGxvdyBhbGwgbW9kZWxzIGZvciBmbGV4aWJpbGl0eSBpbiBkZXZcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIC8vIEFjY2VzcyBSb2xlIGZvciBFQ1IgUHVsbCDigJQgbXVzdCB0cnVzdCBidWlsZC5hcHBydW5uZXIuYW1hem9uYXdzLmNvbSAoTk9UIHRhc2tzKVxyXG4gICAgICAgIGNvbnN0IGFjY2Vzc1JvbGUgPSBuZXcgaWFtLlJvbGUodGhpcywgJ1JhYXNBcHBSdW5uZXJFQ1JSb2xlJywge1xyXG4gICAgICAgICAgICBhc3N1bWVkQnk6IG5ldyBpYW0uU2VydmljZVByaW5jaXBhbCgnYnVpbGQuYXBwcnVubmVyLmFtYXpvbmF3cy5jb20nKSxcclxuICAgICAgICAgICAgbWFuYWdlZFBvbGljaWVzOiBbXHJcbiAgICAgICAgICAgICAgICBpYW0uTWFuYWdlZFBvbGljeS5mcm9tTWFuYWdlZFBvbGljeUFybih0aGlzLCAnQXBwUnVubmVyRUNSQWNjZXNzJywgJ2Fybjphd3M6aWFtOjphd3M6cG9saWN5L3NlcnZpY2Utcm9sZS9BV1NBcHBSdW5uZXJTZXJ2aWNlUG9saWN5Rm9yRUNSQWNjZXNzJylcclxuICAgICAgICAgICAgXVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyA0LiBEb2NrZXIgSW1hZ2UgQXNzZXRcclxuICAgICAgICBjb25zdCBhc3NldCA9IG5ldyBhc3NldHMuRG9ja2VySW1hZ2VBc3NldCh0aGlzLCAnQmFja2VuZEltYWdlJywge1xyXG4gICAgICAgICAgICBkaXJlY3Rvcnk6IHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi8uLi9iYWNrZW5kJyksXHJcbiAgICAgICAgICAgIHBsYXRmb3JtOiBhc3NldHMuUGxhdGZvcm0uTElOVVhfQU1ENjQsIC8vIEVuc3VyZSBMaW51eCBidWlsZFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyA1LiBBcHAgUnVubmVyIFNlcnZpY2VcclxuICAgICAgICBjb25zdCBzZXJ2aWNlID0gbmV3IGFwcHJ1bm5lci5DZm5TZXJ2aWNlKHRoaXMsICdSYWFzQmFja2VuZFNlcnZpY2UnLCB7XHJcbiAgICAgICAgICAgIHNvdXJjZUNvbmZpZ3VyYXRpb246IHtcclxuICAgICAgICAgICAgICAgIGF1dGhlbnRpY2F0aW9uQ29uZmlndXJhdGlvbjoge1xyXG4gICAgICAgICAgICAgICAgICAgIGFjY2Vzc1JvbGVBcm46IGFjY2Vzc1JvbGUucm9sZUFybixcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBpbWFnZVJlcG9zaXRvcnk6IHtcclxuICAgICAgICAgICAgICAgICAgICBpbWFnZUlkZW50aWZpZXI6IGFzc2V0LmltYWdlVXJpLFxyXG4gICAgICAgICAgICAgICAgICAgIGltYWdlUmVwb3NpdG9yeVR5cGU6ICdFQ1InLFxyXG4gICAgICAgICAgICAgICAgICAgIGltYWdlQ29uZmlndXJhdGlvbjoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwb3J0OiAnMzAwMScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJ1bnRpbWVFbnZpcm9ubWVudFZhcmlhYmxlczogW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeyBuYW1lOiAnTk9ERV9FTlYnLCB2YWx1ZTogJ3Byb2R1Y3Rpb24nIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IG5hbWU6ICdEQl9IT1NUJywgdmFsdWU6IGRhdGFiYXNlLmRiSW5zdGFuY2VFbmRwb2ludEFkZHJlc3MgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgbmFtZTogJ0RCX1BPUlQnLCB2YWx1ZTogZGF0YWJhc2UuZGJJbnN0YW5jZUVuZHBvaW50UG9ydCB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeyBuYW1lOiAnREJfTkFNRScsIHZhbHVlOiAnbWFydHluc19sYXdfZGInIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJ1bnRpbWVFbnZpcm9ubWVudFNlY3JldHM6ICgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkNvbmZpZ3VyaW5nIFNlY3JldHMuLi5cIiwgeyBzZWNyZXRFeGlzdHM6ICEhZGF0YWJhc2Uuc2VjcmV0IH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFkYXRhYmFzZS5zZWNyZXQpIHRocm93IG5ldyBFcnJvcihcIkRhdGFiYXNlIHNlY3JldCBpcyB1bmRlZmluZWQhXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQXBwIFJ1bm5lciBydW50aW1lRW52aXJvbm1lbnRTZWNyZXRzIG9ubHkgYWNjZXB0cyBwbGFpbiBzZWNyZXQgQVJOIChubyA6ZmllbGRuYW1lIHN1ZmZpeClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEJhY2tlbmQgbXVzdCBwYXJzZSB0aGUgSlNPTiBzZWNyZXQgdG8gZXh0cmFjdCB1c2VybmFtZS9wYXNzd29yZFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFt7IG5hbWU6ICdEQl9TRUNSRVQnLCB2YWx1ZTogZGF0YWJhc2Uuc2VjcmV0LnNlY3JldEFybiB9XTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSkoKVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBhdXRvRGVwbG95bWVudHNFbmFibGVkOiB0cnVlLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBpbnN0YW5jZUNvbmZpZ3VyYXRpb246IHtcclxuICAgICAgICAgICAgICAgIGluc3RhbmNlUm9sZUFybjogaW5zdGFuY2VSb2xlLnJvbGVBcm4sXHJcbiAgICAgICAgICAgICAgICBjcHU6ICcxIHZDUFUnLFxyXG4gICAgICAgICAgICAgICAgbWVtb3J5OiAnMiBHQicsXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIG5ldHdvcmtDb25maWd1cmF0aW9uOiB7XHJcbiAgICAgICAgICAgICAgICBlZ3Jlc3NDb25maWd1cmF0aW9uOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgZWdyZXNzVHlwZTogJ1ZQQycsXHJcbiAgICAgICAgICAgICAgICAgICAgdnBjQ29ubmVjdG9yQXJuOiBuZXcgYXBwcnVubmVyLkNmblZwY0Nvbm5lY3Rvcih0aGlzLCAnVnBjQ29ubmVjdG9yJywge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdWJuZXRzOiB2cGMucHJpdmF0ZVN1Ym5ldHMubWFwKHMgPT4gcy5zdWJuZXRJZCksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlY3VyaXR5R3JvdXBzOiBbYXBwUnVubmVyU2cuc2VjdXJpdHlHcm91cElkXSxcclxuICAgICAgICAgICAgICAgICAgICB9KS5hdHRyVnBjQ29ubmVjdG9yQXJuLFxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIEdyYW50IFNlY3JldCBSZWFkIEFjY2VzcyB0byBBcHAgUnVubmVyXHJcbiAgICAgICAgZGF0YWJhc2Uuc2VjcmV0Py5ncmFudFJlYWQoaW5zdGFuY2VSb2xlKTtcclxuXHJcbiAgICAgICAgLy8gT3V0cHV0c1xyXG4gICAgICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdBcHBSdW5uZXJVcmwnLCB7XHJcbiAgICAgICAgICAgIHZhbHVlOiBgaHR0cHM6Ly8ke3NlcnZpY2UuYXR0clNlcnZpY2VVcmx9YCxcclxuICAgICAgICB9KTtcclxuICAgICAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnRGF0YWJhc2VFbmRwb2ludCcsIHtcclxuICAgICAgICAgICAgdmFsdWU6IGRhdGFiYXNlLmRiSW5zdGFuY2VFbmRwb2ludEFkZHJlc3MsXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0RhdGFiYXNlU2VjcmV0QXJuJywge1xyXG4gICAgICAgICAgICB2YWx1ZTogZGF0YWJhc2Uuc2VjcmV0Py5zZWNyZXRBcm4gfHwgJ05vIFNlY3JldCBDcmVhdGVkJyxcclxuICAgICAgICB9KTtcclxuXHJcbiAgICB9XHJcbn1cclxuIl19