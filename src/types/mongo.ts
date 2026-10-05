export type BsonFieldType = 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object' | 'objectId';

export interface MongoDocument {
  _id: string;
  [key: string]: any;
}

export interface CollectionFieldMeta {
  name: string;
  type: BsonFieldType;
  required?: boolean;
  refCollection?: string;
}

export interface MongoCollectionMeta {
  name: string;
  count: number;
  fields: CollectionFieldMeta[];
}

export type AggregationStageType = '$match' | '$group' | '$project' | '$sort' | '$unwind' | '$lookup' | '$limit';

export interface AggregationStageConfig {
  id: string;
  type: AggregationStageType;
  query: string; // JSON string for that stage
}

export interface MongoExecutionResult {
  success: boolean;
  documents?: MongoDocument[];
  count?: number;
  executionTimeMs?: number;
  error?: string;
  stagePreviews?: { stage: string; documents: MongoDocument[] }[];
}

export interface MongoDatabaseMeta {
  name: string;
  collectionCount: number;
  totalDocuments: number;
  lastModified: Date;
}
