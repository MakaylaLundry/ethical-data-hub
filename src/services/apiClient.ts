// API Client for backend communication
// Reads VITE_API_BASE_URL and attaches Authorization header

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://149.28.127.248';

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

class ApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
  }

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { skipAuth = false, headers: customHeaders, ...rest } = options;

    const headers: HeadersInit = {
      ...customHeaders,
    };

    // Add Authorization header if we have a token and auth is not skipped
    if (!skipAuth && this.accessToken) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.accessToken}`;
    }

    // Add Content-Type for JSON requests (if not FormData)
    if (rest.body && !(rest.body instanceof FormData)) {
      (headers as Record<string, string>)['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...rest,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.message || errorData.error || `Request failed with status ${response.status}`,
        response.status,
        errorData
      );
    }

    // Handle empty responses
    const text = await response.text();
    if (!text) {
      return {} as T;
    }

    return JSON.parse(text);
  }

  // Health check
  async checkHealth(): Promise<{ ok: boolean }> {
    return this.request('/health', { skipAuth: true });
  }

  // ==================== Company Endpoints ====================

  async getCompanyProfile(): Promise<CompanyProfile> {
    return this.request('/api/v1/company/profile');
  }

  async updateCompanyProfile(data: CompanyProfileUpdate): Promise<CompanyProfile> {
    return this.request('/api/v1/company/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async scanDataset(files: File[], zipFile?: File): Promise<ScanResponse> {
    const formData = new FormData();
    
    files.forEach((file) => {
      formData.append('files[]', file);
    });

    if (zipFile) {
      formData.append('zip', zipFile);
    }

    return this.request('/api/v1/company/scan', {
      method: 'POST',
      body: formData,
    });
  }

  // ==================== Artist Endpoints ====================

  async uploadArtwork(files: File[], permissions: ArtistPermissions): Promise<ArtworkUploadResponse> {
    const formData = new FormData();
    
    files.forEach((file) => {
      formData.append('files[]', file);
    });

    formData.append('permissions', JSON.stringify(permissions));

    return this.request('/api/v1/artist/artworks', {
      method: 'POST',
      body: formData,
    });
  }

  async getArtistTags(): Promise<ArtistTag[]> {
    return this.request('/api/v1/artist/tags');
  }

  async updateTagPermissions(tagId: string, permissions: ArtistPermissions): Promise<ArtistTag> {
    return this.request(`/api/v1/artist/tags/${tagId}/permissions`, {
      method: 'PUT',
      body: JSON.stringify(permissions),
    });
  }

  async revokeTag(tagId: string): Promise<void> {
    return this.request(`/api/v1/artist/tags/${tagId}`, {
      method: 'DELETE',
    });
  }

  async getComplianceEvents(): Promise<ComplianceEvent[]> {
    return this.request('/api/v1/artist/compliance');
  }
}

// Custom error class for API errors
export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// ==================== Types ====================

export interface CompanyProfile {
  company_name: string;
  declared_use_cases: string[];
  description?: string;
}

export interface CompanyProfileUpdate {
  company_name: string;
  declared_use_cases: string[];
  description?: string;
}

export interface ScanSummary {
  totalFilesScanned: number;
  matchedItems: number;
  unmatchedFiles: number;
  allowed: number;
  conditional: number;
  restricted: number;
}

export interface ScanReportItem {
  file_name: string;
  artist_id?: string;
  artist_name?: string;
  tag_id?: string;
  permissions?: ArtistPermissions;
}

export interface SimilarityFinding {
  file_name: string;
  similarity_score?: number;
  artist_name?: string;
  tag_id?: string;
}

export interface ScanResponse {
  summary: ScanSummary;
  report: {
    allowed: ScanReportItem[];
    conditional: ScanReportItem[];
    restricted: ScanReportItem[];
    unmatched: ScanReportItem[];
  };
  similarityFindings?: {
    work_at_risk: SimilarityFinding[];
    may_be_at_risk: SimilarityFinding[];
  };
}

export interface ArtistPermissions {
  ai_training: 'yes' | 'no' | 'conditional';
  allowed_use_cases: string[];
  attribution: boolean;
  notes?: string;
  other_use_case?: string;
}

export interface ArtistTag {
  id: string;
  tag_id: string;
  file_name: string;
  file_url?: string;
  permissions: ArtistPermissions;
  created_at: string;
  version?: number;
}

export interface ArtworkUploadResponse {
  tags: ArtistTag[];
}

export interface ComplianceEvent {
  id: string;
  company_name: string;
  use_case: string;
  date: string;
  outcome: 'allowed' | 'removed' | 'agreement_accepted';
  artwork_name: string;
  eventType?: 'match' | 'similarity';
  similarity_score?: number;
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL);

export default apiClient;
