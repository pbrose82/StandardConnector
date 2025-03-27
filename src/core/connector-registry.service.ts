import { Connector } from './connector.interface';
import { SalesforceConnector } from '../connectors/salesforce/salesforce.connector';
import { HubSpotConnector } from '../connectors/hubspot/hubspot.connector';
import { SAPS4HANAConnector } from '../connectors/sap/sap-s4hana.connector';
import { logger } from '../utils/logger';

class ConnectorRegistry {
  private connectors: Map<string, Connector> = new Map();
  private connectorFactories: Map<string, () => Connector> = new Map();

  constructor() {
    this.registerBuiltInConnectors();
  }

  private registerBuiltInConnectors() {
    // Register factory functions for built-in connectors
    this.registerFactory('salesforce', () => new SalesforceConnector());
    this.registerFactory('hubspot', () => new HubSpotConnector());
    this.registerFactory('sap-s4hana', () => new SAPS4HANAConnector());
    
    logger.info('Built-in connectors registered');
  }

  /**
   * Register a connector factory function
   */
  registerFactory(id: string, factory: () => Connector) {
    this.connectorFactories.set(id, factory);
    logger.info(`Registered connector factory: ${id}`);
  }

  /**
   * Register a connector instance
   */
  register(connector: Connector) {
    this.connectors.set(connector.id, connector);
    logger.info(`Registered connector instance: ${connector.id}`);
  }

  /**
   * Get a connector instance, creating it if necessary
   */
  getConnector(id: string): Connector | undefined {
    // Return existing instance if available
    if (this.connectors.has(id)) {
      return this.connectors.get(id);
    }
    
    // Create new instance if factory exists
    if (this.connectorFactories.has(id)) {
      const factory = this.connectorFactories.get(id);
      if (factory) {
        const connector = factory();
        this.connectors.set(id, connector);
        logger.info(`Created connector instance: ${id}`);
        return connector;
      }
    }
    
    logger.warn(`Connector not found: ${id}`);
    return undefined;
  }

  /**
   * Get all available connector types
   */
  getAvailableConnectorTypes(): string[] {
    return Array.from(this.connectorFactories.keys());
  }

  /**
   * Get all active connector instances
   */
  getAllConnectors(): Connector[] {
    return Array.from(this.connectors.values());
  }
}

// Export a singleton instance
export const connectorRegistry = new ConnectorRegistry();
