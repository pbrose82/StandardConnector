async delete(entityId: string, id: string): Promise<DeleteResult> {
    try {
      this.ensureClient();
      
      // Salesforce doesn't return data on DELETE, just a 204 No Content
      await this.client!.delete(
        `/services/data/${this.apiVersion}/sobjects/${entityId}/${id}`
      );
      
      return {
        success: true,
        id
      };
    } catch (error) {
      logger.error(`Error deleting Salesforce ${entityId}:`, error);
      return {
        success: false,
        id,
        error: getErrorMessage(error)
      };
    }
  }
  
  async getSupportedEvents(): Promise<WebhookEvent[]> {
    return [
      {
        id: 'record.created',
        name: 'Record Created',
        description: 'Triggered when a record is created'
      },
      {
        id: 'record.updated',
        name: 'Record Updated',
        description: 'Triggered when a record is updated'
      },
      {
        id: 'record.deleted',
        name: 'Record Deleted',
        description: 'Triggered when a record is deleted'
      }
    ];
  }
  
  private initializeClient(accessToken: string, instanceUrl: string): void {
    this.client = axios.create({
      baseURL: instanceUrl,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      timeout: config.connectorTimeoutMs
    });
    
    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 401) {
          // Token expired, should trigger a refresh
          logger.warn('Salesforce token expired');
        }
        return Promise.reject(error);
      }
    );
  }
  
  private ensureClient(): void {
    if (!this.client) {
      throw new Error('Salesforce client not initialized. Call authenticate() first.');
    }
  }
  
  private mapSalesforceType(sfType: string): string {
    const typeMap: Record<string, string> = {
      'id': 'string',
      'string': 'string',
      'picklist': 'enum',
      'multipicklist': 'array',
      'boolean': 'boolean',
      'int': 'integer',
      'double': 'number',
      'currency': 'number',
      'percent': 'number',
      'date': 'date',
      'datetime': 'datetime',
      'reference': 'reference',
      'email': 'email',
      'phone': 'phone',
      'url': 'url',
      'textarea': 'text',
      'address': 'address'
    };
    
    return typeMap[sfType] || 'string';
  }
}
