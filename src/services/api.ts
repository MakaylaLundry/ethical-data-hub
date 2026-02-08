// Mock API service for Inkscape
// Simulates backend endpoints

export interface Permission {
  ai_training: 'yes' | 'no' | 'conditional';
  allowed_use_cases: string[];
  attribution: boolean;
  notes?: string;
  other_use_case?: string;
}

export interface ArtworkTag {
  id: string;
  tag_id: string;
  file_name: string;
  file_url: string;
  permissions: Permission;
  created_at: string;
  artist_id: string;
}

export interface ScanResultItem {
  file_name: string;
  status: 'allowed' | 'restricted' | 'conditional';
  artist_id: string;
  artist_name: string;
  tag_id: string;
}

export interface ScanResult {
  scan_id: string;
  total_files: number;
  safe_to_use: number;
  restricted: number;
  conditional: number;
  items: ScanResultItem[];
  scanned_at: string;
}

export interface ComplianceLog {
  id: string;
  company_name: string;
  use_case: string;
  date: string;
  outcome: 'allowed' | 'removed' | 'agreement_accepted';
  artwork_name: string;
}

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Generate a UUID-like ID
const generateId = () => 'tag_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);

// Mock artwork database
let mockArtworks: ArtworkTag[] = [];
let mockScans: ScanResult[] = [];
let mockComplianceLogs: ComplianceLog[] = [
  {
    id: 'log_1',
    company_name: 'OpenAI Research',
    use_case: 'Research',
    date: '2024-01-15',
    outcome: 'allowed',
    artwork_name: 'Abstract Sunset.png',
  },
  {
    id: 'log_2',
    company_name: 'ArtGen Inc.',
    use_case: 'Image Generation',
    date: '2024-01-14',
    outcome: 'removed',
    artwork_name: 'Portrait Study.jpg',
  },
  {
    id: 'log_3',
    company_name: 'DataVision Labs',
    use_case: 'Fine-tuning',
    date: '2024-01-12',
    outcome: 'agreement_accepted',
    artwork_name: 'Landscape Series #4.png',
  },
];

// Upload artwork and generate security tag
export async function uploadArtwork(
  file: File,
  permissions: Permission,
  artistId: string
): Promise<ArtworkTag> {
  await delay(800);
  
  const tag: ArtworkTag = {
    id: generateId(),
    tag_id: generateId(),
    file_name: file.name,
    file_url: URL.createObjectURL(file),
    permissions,
    created_at: new Date().toISOString(),
    artist_id: artistId,
  };
  
  mockArtworks.push(tag);
  return tag;
}

// Get all artworks for an artist
export async function getArtworks(artistId: string): Promise<ArtworkTag[]> {
  await delay(300);
  return mockArtworks.filter(a => a.artist_id === artistId);
}

// Update artwork permissions
export async function updateArtworkPermissions(
  tagId: string,
  permissions: Permission
): Promise<ArtworkTag | null> {
  await delay(400);
  const index = mockArtworks.findIndex(a => a.tag_id === tagId);
  if (index !== -1) {
    mockArtworks[index] = { ...mockArtworks[index], permissions };
    return mockArtworks[index];
  }
  return null;
}

// Revoke (delete) artwork tag
export async function revokeTag(tagId: string): Promise<boolean> {
  await delay(300);
  const index = mockArtworks.findIndex(a => a.tag_id === tagId);
  if (index !== -1) {
    mockArtworks.splice(index, 1);
    return true;
  }
  return false;
}

// Get compliance logs for an artist
export async function getComplianceLogs(_artistId: string): Promise<ComplianceLog[]> {
  await delay(300);
  return mockComplianceLogs;
}

// Scan dataset (company flow)
export async function scanDataset(files: File[]): Promise<ScanResult> {
  await delay(1500); // Simulate longer processing time
  
  const artistNames = ['Maya Chen', 'Alex Rivera', 'Jordan Smith', 'Sam Taylor', 'Chris Lee'];
  const statuses: ('allowed' | 'restricted' | 'conditional')[] = ['allowed', 'restricted', 'conditional'];
  
  const items: ScanResultItem[] = files.map(file => ({
    file_name: file.name,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    artist_id: 'artist_' + Math.random().toString(36).substr(2, 6),
    artist_name: artistNames[Math.floor(Math.random() * artistNames.length)],
    tag_id: generateId(),
  }));
  
  const result: ScanResult = {
    scan_id: 'scan_' + Date.now().toString(36),
    total_files: files.length,
    safe_to_use: items.filter(i => i.status === 'allowed').length,
    restricted: items.filter(i => i.status === 'restricted').length,
    conditional: items.filter(i => i.status === 'conditional').length,
    items,
    scanned_at: new Date().toISOString(),
  };
  
  mockScans.push(result);
  return result;
}

// Get scan history
export async function getScanHistory(): Promise<ScanResult[]> {
  await delay(300);
  return mockScans;
}

// Generate agreement for conditional use
export async function generateAgreement(
  tagId: string,
  companyName: string,
  useCase: string
): Promise<string> {
  await delay(800); // Simulate Gemini API call
  
  return `DATA USE AGREEMENT

This Agreement ("Agreement") is entered into between the Artist (Tag ID: ${tagId}) and ${companyName} ("Company").

1. PURPOSE
The Company is granted conditional permission to use the tagged artwork for the following purpose: ${useCase}.

2. TERMS AND CONDITIONS
   a) The artwork may only be used for the specified purpose stated above.
   b) The Company agrees to provide attribution as required by the Artist's permissions.
   c) This license is non-transferable and non-exclusive.
   d) The Company shall not sublicense or distribute the artwork to third parties.

3. ATTRIBUTION
The Company agrees to provide clear and visible attribution to the Artist in any output or derivative work where technically feasible.

4. DURATION
This agreement remains in effect for a period of one (1) year from the date of acceptance, unless terminated earlier by either party.

5. TERMINATION
Either party may terminate this agreement with 30 days written notice. Upon termination, the Company shall cease all use of the artwork.

6. COMPLIANCE
The Company agrees to maintain records of artwork usage and provide reports upon Artist request.

By accepting this agreement, both parties acknowledge and agree to these terms.

Generated on: ${new Date().toLocaleDateString()}
Agreement ID: AGR-${Date.now().toString(36).toUpperCase()}`;
}
