/**
 * Represents the event structure generated by AWS API Gateway
 * using a **Velocity Template Language (VTL)** mapping template
 * in **non-proxy integration** mode.
 *
 * This shape mirrors the custom object created manually in the
 * Integration Request mapping template.
 *
 * Example VTL:
 * src/utils/vtls/general.template.vtl
 */
export type APIGatewayEvent<TBody = any> = {
  httpMethod: string;
  resourcePath: string;
  headers: Record<string, string>;
  queryStringParameters: Record<string, string>;
  pathParameters: Record<string, string>;
  body: TBody;
};
