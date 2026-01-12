export enum Severity {
  CRITICAL = 'Critical',
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low',
  INFO = 'Info'
}

export interface Finding {
  id: string;
  title: string;
  severity: Severity;
  cvssScore: number;
  cvssVector?: string;
  cveId?: string;
  cweId?: string;
  owaspId?: string;
  description: string;
  remediation: string;
  references: string[];
  status: 'Open' | 'Closed' | 'Fixed';
}

export interface Report {
  id: string;
  name: string;
  client: string;
  date: string;
  status: 'Draft' | 'Review' | 'Final';
  executiveSummary?: string;
  findings: Finding[];
}

export interface AIAnalysisResult {
  description: string;
  remediation: string;
  cweId: string;
  owaspId: string;
  cvssScore?: number;
  references?: string[];
  severity?: string;
  cveId?: string;
}

export interface ChartData {
  name: string;
  value: number;
  color: string;
}