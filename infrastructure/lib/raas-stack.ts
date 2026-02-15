import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as opensearch from 'aws-cdk-lib/aws-opensearchservice';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as apprunner from 'aws-cdk-lib/aws-apprunner';
import * as assets from 'aws-cdk-lib/aws-ecr-assets';
import * as path from 'path';

export class RaasStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // 1. VPC: Create a VPC in eu-west-2 with public/private subnets
        const vpc = new ec2.Vpc(this, 'RaasVpc', {
            maxAzs: 2,
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

        // Security Group for App Runner
        const appRunnerSg = new ec2.SecurityGroup(this, 'AppRunnerSG', {
            vpc,
            description: 'Security group for App Runner service',
            allowAllOutbound: true,
        });

        // 2. OpenSearch: Provision an Amazon OpenSearch domain
        const domain = new opensearch.Domain(this, 'RaasSearchDomain', {
            version: opensearch.EngineVersion.OPENSEARCH_2_11,
            capacity: {
                dataNodeInstanceType: 't3.small.search',
                dataNodes: 1,
            },
            ebs: {
                volumeSize: 10,
                volumeType: ec2.EbsDeviceVolumeType.GP3,
            },
            vpc,
            vpcSubnets: [
                { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }
            ],
            securityGroups: [
                new ec2.SecurityGroup(this, 'OpenSearchSG', {
                    vpc,
                    description: 'Security group for OpenSearch domain',
                    allowAllOutbound: true,
                })
            ],
            enforceHttps: true,
            nodeToNodeEncryption: true,
            encryptionAtRest: {
                enabled: true,
            },
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });

        // 3. Access Policy: Configure to allow access ONLY from App Runner SG
        domain.addAccessPolicies(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            principals: [new iam.AnyPrincipal()],
            actions: ['es:*'],
            resources: [domain.domainArn + '/*'],
        }));

        domain.connections.allowFrom(appRunnerSg, ec2.Port.tcp(443), 'Allow HTTPS from App Runner');

        // 4. IAM: Define an IAM Role for the ECS Task (Bedrock access)
        // Note: App Runner Instance Role
        const instanceRole = new iam.Role(this, 'RaasAppRunnerInstanceRole', {
            assumedBy: new iam.ServicePrincipal('tasks.apprunner.amazonaws.com'),
        });

        instanceRole.addToPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'bedrock:InvokeModel',
                'bedrock:ApplyGuardrail'
            ],
            resources: [
                `arn:aws:bedrock:${this.region}::foundation-model/anthropic.claude-3-5-sonnet-20240620-v1:0`,
                `arn:aws:bedrock:${this.region}::foundation-model/anthropic.claude-3.5-sonnet`
            ],
        }));

        // Access Role for App Runner to pull from ECR
        const accessRole = new iam.Role(this, 'RaasAppRunnerAccessRole', {
            assumedBy: new iam.ServicePrincipal('build.apprunner.amazonaws.com'),
        });
        accessRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSAppRunnerServicePolicyForECRAccess'));

        // 5. Docker Image Asset
        const asset = new assets.DockerImageAsset(this, 'BackendImage', {
            directory: path.join(__dirname, '../../backend'),
        });

        // 6. App Runner Service
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
                            { name: 'OPENSEARCH_ENDPOINT', value: `https://${domain.domainEndpoint}` }
                        ]
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

        // Outputs
        new cdk.CfnOutput(this, 'AppRunnerUrl', {
            value: `https://${service.attrServiceUrl}`,
        });
        new cdk.CfnOutput(this, 'OpenSearchEndpoint', {
            value: domain.domainEndpoint,
        });
    }
}
