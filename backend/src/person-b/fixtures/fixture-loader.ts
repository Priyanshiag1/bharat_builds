import * as fs from 'fs';
import * as path from 'path';
import { Document } from '../domain/models';

export interface FixtureData {
  claimId: string;
  documents: Document[];
  rawExtractionPayloads: Record<string, any>; // Mock Textract responses
  rawCommunicationPayloads: Record<string, string>; // Mock emails/chats
}

export class FixtureLoader {
  private readonly fixturesDir: string;

  constructor() {
    this.fixturesDir = path.join(__dirname, 'data');
  }

  public loadFixture(claimId: string): FixtureData {
    const filePath = path.join(this.fixturesDir, `${claimId}.json`);
    return this.loadFixtureByPath(filePath);
  }

  public loadFixtureByPath(filePath: string): FixtureData {
    const absolutePath = path.resolve(process.cwd(), filePath);
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`Fixture not found at path: ${absolutePath}`);
    }

    const fileContent = fs.readFileSync(absolutePath, 'utf-8');
    try {
      return JSON.parse(fileContent) as FixtureData;
    } catch (e) {
      throw new Error(`Invalid JSON in fixture: ${absolutePath}`);
    }
  }
}
