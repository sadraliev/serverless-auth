let memoryDb = new Map<string, Record<string, any>>();

export interface DynamoMockItem {
  TableName: string;
  Item?: Record<string, any>;
  Key?: Record<string, any>;
}

class MockDynamoClient {
  async put(params: DynamoMockItem): Promise<void> {
    if (!params.Item || !params.TableName) throw new Error("Invalid put input");
    const key = this._key(params.TableName, params.Item);
    memoryDb.set(key, params.Item);
  }

  async get(params: DynamoMockItem): Promise<{ Item?: Record<string, any> }> {
    const key = this._key(params.TableName, params.Key || {});
    return { Item: memoryDb.get(key) };
  }

  async delete(params: DynamoMockItem): Promise<void> {
    const key = this._key(params.TableName, params.Key || {});
    memoryDb.delete(key);
  }

  private _key(table: string, keyObj: Record<string, any>): string {
    const keyVal = Object.entries(keyObj)
      .map(([k, v]) => `${k}:${v}`)
      .join("|");
    return `${table}::${keyVal}`;
  }

  clearAll(): void {
    memoryDb.clear();
  }
}

// Export actual or mocked DocumentClient
export default new MockDynamoClient();
