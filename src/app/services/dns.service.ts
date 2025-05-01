import {
  Route53Client,
  ChangeResourceRecordSetsCommand,
  ChangeAction,
  RRType,
  CreateHostedZoneCommand,
  ListHostedZonesCommand,
  GetHostedZoneCommand,
} from "@aws-sdk/client-route-53";

const region = process.env.CUSTOM_REGION;

const route53Client = new Route53Client({
  region,
  credentials: {
    accessKeyId: process.env.CUSTOM_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.CUSTOM_SECRET_ACCESS_KEY ?? "",
  },
});

export interface DNSRecord {
  name: string;
  value: string;
  ttl: number;
  type?: string; // Optional since we're using RRType.CNAME
}

export class DNSService {
  /**
   * Creates a CNAME record in Route53
   */
  static async createCNAMERecord(hostedZoneId: string, record: DNSRecord) {
    try {
      const command = new ChangeResourceRecordSetsCommand({
        HostedZoneId: hostedZoneId,
        ChangeBatch: {
          Changes: [
            {
              Action: ChangeAction.CREATE,
              ResourceRecordSet: {
                Name: record.name,
                Type: RRType.CNAME,
                TTL: record.ttl,
                ResourceRecords: [
                  {
                    Value: record.value,
                  },
                ],
              },
            },
          ],
        },
      });

      const response = await route53Client.send(command);
      return response.ChangeInfo;
    } catch (error) {
      console.error("Error creating CNAME record:", error);
      throw error;
    }
  }

  /**
   * Creates validation records for SSL certificate
   */
  static async createValidationRecords(
    hostedZoneId: string,
    validationRecords: Array<{
      domainName: string;
      validationRecord: {
        Name: string;
        Type: string;
        Value: string;
      };
    }>
  ) {
    try {
      const changes = validationRecords.map((record) => ({
        Action: ChangeAction.CREATE,
        ResourceRecordSet: {
          Name: record.validationRecord.Name,
          Type: RRType.CNAME,
          TTL: 300,
          ResourceRecords: [
            {
              Value: record.validationRecord.Value,
            },
          ],
        },
      }));

      const command = new ChangeResourceRecordSetsCommand({
        HostedZoneId: hostedZoneId,
        ChangeBatch: {
          Changes: changes,
        },
      });

      const response = await route53Client.send(command);
      return response.ChangeInfo;
    } catch (error) {
      console.error("Error creating validation records:", error);
      throw error;
    }
  }

  /**
   * Creates a Route53 hosted zone for a domain
   */
  static async createHostedZone(domainName: string) {
    try {
      const command = new CreateHostedZoneCommand({
        Name: domainName,
        CallerReference: `${domainName}-${Date.now()}`,
        HostedZoneConfig: {
          Comment: `Hosted zone for ${domainName}`,
          PrivateZone: false,
        },
      });

      const response = await route53Client.send(command);
      return response.HostedZone?.Id?.replace("/hostedzone/", "");
    } catch (error) {
      console.error("Error creating hosted zone:", error);
      throw error;
    }
  }

  /**
   * Gets the nameservers for a hosted zone
   */
  static async getHostedZoneNameservers(hostedZoneId: string) {
    try {
      const command = new GetHostedZoneCommand({
        Id: hostedZoneId,
      });

      const response = await route53Client.send(command);
      return response.DelegationSet?.NameServers;
    } catch (error) {
      console.error("Error getting hosted zone nameservers:", error);
      throw error;
    }
  }

  /**
   * Creates Route53 records for CloudFront distribution
   */
  static async setupCloudFrontRecords(
    domainName: string,
    distributionDomain: string
  ) {
    try {
      // Create hosted zone if it doesn't exist
      let hostedZoneId = await this.getHostedZoneId(domainName);
      if (!hostedZoneId) {
        hostedZoneId = await this.createHostedZone(domainName);
      }

      if (!hostedZoneId) {
        throw new Error("Failed to get or create hosted zone");
      }

      // Get the nameservers for the hosted zone
      const nameservers = await this.getHostedZoneNameservers(hostedZoneId);

      // Create A record for root domain
      const rootCommand = new ChangeResourceRecordSetsCommand({
        HostedZoneId: hostedZoneId,
        ChangeBatch: {
          Changes: [
            {
              Action: ChangeAction.UPSERT,
              ResourceRecordSet: {
                Name: domainName,
                Type: RRType.A,
                AliasTarget: {
                  HostedZoneId: "Z2FDTNDATAQYW2", // CloudFront hosted zone ID
                  DNSName: distributionDomain,
                  EvaluateTargetHealth: false,
                },
              },
            },
          ],
        },
      });

      // Create A record for www subdomain
      const wwwCommand = new ChangeResourceRecordSetsCommand({
        HostedZoneId: hostedZoneId,
        ChangeBatch: {
          Changes: [
            {
              Action: ChangeAction.UPSERT,
              ResourceRecordSet: {
                Name: `www.${domainName}`,
                Type: RRType.A,
                AliasTarget: {
                  HostedZoneId: "Z2FDTNDATAQYW2", // CloudFront hosted zone ID
                  DNSName: distributionDomain,
                  EvaluateTargetHealth: false,
                },
              },
            },
          ],
        },
      });

      await Promise.all([
        route53Client.send(rootCommand),
        route53Client.send(wwwCommand),
      ]);

      return {
        hostedZoneId,
        nameservers,
        records: [
          {
            name: domainName,
            type: "A",
            target: distributionDomain,
          },
          {
            name: `www.${domainName}`,
            type: "A",
            target: distributionDomain,
          },
        ],
      };
    } catch (error) {
      console.error("Error setting up CloudFront records:", error);
      throw error;
    }
  }

  /**
   * Gets the hosted zone ID for a domain
   */
  static async getHostedZoneId(domainName: string) {
    try {
      const command = new ListHostedZonesCommand({});
      const response = await route53Client.send(command);

      if (!response.HostedZones) return null;

      // Find the hosted zone that matches the domain
      const hostedZone = response.HostedZones.find(
        (zone) =>
          zone.Name === `${domainName}.` || zone.Name === `www.${domainName}.`
      );

      return hostedZone?.Id?.replace("/hostedzone/", "");
    } catch (error) {
      console.error("Error getting hosted zone ID:", error);
      throw error;
    }
  }
}
