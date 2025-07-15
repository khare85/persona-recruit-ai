/**
 * Document AI Service for processing resumes and documents
 */

import { DocumentProcessorServiceClient } from '@google-cloud/documentai';

export class DocumentAIService {
  private client: DocumentProcessorServiceClient;
  private projectId: string;
  private location: string;
  private processorId: string;

  constructor() {
    this.client = new DocumentProcessorServiceClient();
    this.projectId = process.env.GOOGLE_CLOUD_PROJECT || 'ai-talent-stream';
    this.location = 'us-central1';
    this.processorId = process.env.DOCUMENT_AI_PROCESSOR_ID || '';
  }

  async processResume(resumeBuffer: Buffer, mimeType: string): Promise<any> {
    try {
      if (!this.processorId) {
        throw new Error('Document AI processor ID not configured');
      }

      const name = `projects/${this.projectId}/locations/${this.location}/processors/${this.processorId}`;
      
      const request = {
        name,
        rawDocument: {
          content: resumeBuffer.toString('base64'),
          mimeType: mimeType
        }
      };

      const [result] = await this.client.processDocument(request);
      
      return this.extractResumeData(result);
    } catch (error) {
      console.error('Document AI processing error:', error);
      throw error;
    }
  }

  private extractResumeData(document: any): any {
    // Extract structured data from the document
    const entities = document.entities || [];
    const text = document.text || '';
    
    return {
      text,
      entities,
      extractedData: {
        name: this.extractEntity(entities, 'name'),
        email: this.extractEntity(entities, 'email'),
        phone: this.extractEntity(entities, 'phone'),
        skills: this.extractEntity(entities, 'skills'),
        experience: this.extractEntity(entities, 'experience'),
        education: this.extractEntity(entities, 'education')
      }
    };
  }

  private extractEntity(entities: any[], entityType: string): string | null {
    const entity = entities.find(e => e.type === entityType);
    return entity ? entity.mentionText : null;
  }
}