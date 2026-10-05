import mingo from 'mingo';
import { MongoDocument, MongoCollectionMeta, CollectionFieldMeta, MongoExecutionResult } from '../../types/mongo';

// In-memory collections store: Map<CollectionName, MongoDocument[]>
export class MongoEngine {
  private collections: Map<string, MongoDocument[]> = new Map();
  public dbName: string;

  constructor(dbName: string = 'mi_base_mongo') {
    this.dbName = dbName;
  }

  public getCollectionNames(): string[] {
    return Array.from(this.collections.keys()).sort();
  }

  public createCollection(name: string, initialDocs: MongoDocument[] = []): boolean {
    const cleanName = name.trim().toLowerCase();
    if (!cleanName) throw new Error('El nombre de la colección no puede estar vacío.');
    if (this.collections.has(cleanName)) throw new Error(`La colección "${cleanName}" ya existe.`);
    
    this.collections.set(cleanName, initialDocs);
    return true;
  }

  public dropCollection(name: string): boolean {
    return this.collections.delete(name);
  }

  public getCollectionData(name: string): MongoDocument[] {
    return this.collections.get(name) || [];
  }

  public setCollectionData(name: string, data: MongoDocument[]) {
    this.collections.set(name, data);
  }

  public generateObjectId(): string {
    const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
    const random = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    return (timestamp + random).substring(0, 24);
  }

  public insertDocument(collectionName: string, docData: Record<string, any>): MongoDocument {
    const data = this.getCollectionData(collectionName);
    const newDoc: MongoDocument = {
      _id: docData._id || this.generateObjectId(),
      ...docData
    };
    data.push(newDoc);
    this.collections.set(collectionName, data);
    return newDoc;
  }

  public updateDocument(collectionName: string, id: string, docData: Record<string, any>): MongoDocument {
    const data = this.getCollectionData(collectionName);
    const index = data.findIndex(d => d._id === id);
    if (index === -1) throw new Error(`Documento con _id "${id}" no encontrado.`);
    
    const updatedDoc: MongoDocument = {
      ...docData,
      _id: id // preserve _id
    };
    data[index] = updatedDoc;
    this.collections.set(collectionName, data);
    return updatedDoc;
  }

  public deleteDocument(collectionName: string, id: string): boolean {
    const data = this.getCollectionData(collectionName);
    const newData = data.filter(d => d._id !== id);
    if (newData.length === data.length) return false;
    this.collections.set(collectionName, newData);
    return true;
  }

  public getCollectionsMetadata(): MongoCollectionMeta[] {
    const result: MongoCollectionMeta[] = [];
    
    this.collections.forEach((docs, name) => {
      const fieldMap = new Map<string, CollectionFieldMeta>();
      
      // Infer fields from documents
      docs.forEach(doc => {
        Object.keys(doc).forEach(key => {
          if (key === '_id') return;
          const val = doc[key];
          let type: CollectionFieldMeta['type'] = 'string';
          
          if (typeof val === 'number') type = 'number';
          else if (typeof val === 'boolean') type = 'boolean';
          else if (Array.isArray(val)) type = 'array';
          else if (val instanceof Date) type = 'date';
          else if (typeof val === 'object' && val !== null) type = 'object';
          else if (typeof val === 'string' && val.length === 24 && /^[0-9a-fA-F]{24}$/.test(val)) type = 'objectId';

          if (!fieldMap.has(key)) {
            fieldMap.set(key, { name: key, type });
          }
        });
      });

      result.push({
        name,
        count: docs.length,
        fields: Array.from(fieldMap.values())
      });
    });

    return result;
  }

  public runFindQuery(collectionName: string, filterObj: Record<string, any> = {}, projectionObj?: Record<string, any>): MongoExecutionResult {
    const startTime = performance.now();
    try {
      const docs = this.getCollectionData(collectionName);
      const query = new mingo.Query(filterObj, projectionObj);
      const cursor = query.find(docs);
      const results = cursor.all() as MongoDocument[];
      const endTime = performance.now();

      return {
        success: true,
        documents: results,
        count: results.length,
        executionTimeMs: Math.round((endTime - startTime) * 100) / 100
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Error al ejecutar la consulta find().'
      };
    }
  }

  public runAggregationPipeline(collectionName: string, pipeline: Array<Record<string, any>>): MongoExecutionResult {
    const startTime = performance.now();
    try {
      const docs = this.getCollectionData(collectionName);
      
      // Run step-by-step to record stage previews
      const stagePreviews: { stage: string; documents: MongoDocument[] }[] = [];
      let currentData = [...docs];

      pipeline.forEach((stage, idx) => {
        const stageName = Object.keys(stage)[0] || `Stage ${idx + 1}`;
        const aggregator = new mingo.Aggregator([stage]);
        currentData = aggregator.run(currentData) as MongoDocument[];
        stagePreviews.push({
          stage: `${stageName}: ${JSON.stringify(stage[stageName])}`,
          documents: JSON.parse(JSON.stringify(currentData))
        });
      });

      const endTime = performance.now();

      return {
        success: true,
        documents: currentData,
        count: currentData.length,
        executionTimeMs: Math.round((endTime - startTime) * 100) / 100,
        stagePreviews
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Error al ejecutar la agregación MongoDB.'
      };
    }
  }

  public exportToJson(): string {
    const exportObj: Record<string, MongoDocument[]> = {};
    this.collections.forEach((docs, name) => {
      exportObj[name] = docs;
    });
    return JSON.stringify({ dbName: this.dbName, collections: exportObj }, null, 2);
  }

  public importFromJson(jsonStr: string) {
    const parsed = JSON.parse(jsonStr);
    if (parsed.dbName) this.dbName = parsed.dbName;
    if (parsed.collections && typeof parsed.collections === 'object') {
      this.collections.clear();
      Object.keys(parsed.collections).forEach(name => {
        this.collections.set(name, parsed.collections[name]);
      });
    }
  }
}
