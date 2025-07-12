// Educational Resources Interfaces based on Backend DTOs

export enum ResourceType {
  PDF = 'pdf',
  VIDEO = 'video',
  IMAGE = 'image',
  DOCX = 'docx',
  PPTX = 'pptx',
  XLSX = 'xlsx',
  TXT = 'txt',
  AUDIO = 'audio',
  ZIP = 'zip'
}

export enum EducationLevel {
  ELEMENTARY = 'ELEMENTARY',
  HIGH_SCHOOL = 'HIGH_SCHOOL', 
  TECHNICAL = 'TECHNICAL',
  HIGHER = 'HIGHER',
  ALL = 'ALL'
}

export enum AccessLevel {
  PUBLIC = 'PUBLIC',
  SCHOOL_ONLY = 'SCHOOL_ONLY',
  PRIVATE = 'PRIVATE'
}

export interface IResourceUploader {
  uid: string;
  fullName: string;
  role: string;
  school: string;
  avatar?: string;
}

export interface IResourceComment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userRole: string;
  content: string;
  rating?: number;
  createdAt: Date;
  updatedAt?: Date;
  canEdit: boolean;
  canDelete: boolean;
}

export interface IResourceMetadata {
  mimeType: string;
  encoding?: string;
  checksum: string;
  virusScan?: {
    status: 'clean' | 'infected' | 'pending';
    scannedAt: Date;
  };
  videoInfo?: {
    codec: string;
    resolution: string;
    bitrate: number;
    fps: number;
    durationFormatted: string;
  };
  documentInfo?: {
    author?: string;
    title?: string;
    subject?: string;
    creator?: string;
    producer?: string;
    creationDate?: Date;
    pageCount?: number;
  };
}

export interface IEducationalResource {
  id: string;
  uploader: IResourceUploader;
  type: ResourceType;
  name: string;
  originalName: string;
  description?: string;
  tags: string[];
  subject?: string;
  educationLevel?: EducationLevel;
  size: number;
  sizeFormatted: string;
  uploadDate: Date;
  lastModified: Date;
  thumbnail?: string;
  duration?: number;
  durationFormatted?: string;
  pages?: number;
  downloadUrl: string;
  isPublished: boolean;
  publishedAt?: Date;
  publishedBy?: string;
  downloadCount: number;
  viewCount: number;
  rating?: number;
  ratingCount?: number;
  comments: IResourceComment[];
  commentsCount: number;
  metadata?: IResourceMetadata;
  accessLevel: AccessLevel;
  school?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // User permissions
  canEdit: boolean;
  canDelete: boolean;
  canDownload: boolean;
  canComment: boolean;
  canPublish: boolean;
  
  // User interactions
  hasDownloaded: boolean;
  hasRated: boolean;
  userRating?: number;
  hasCommented: boolean;
}

export interface IResourcesListResponse {
  resources: IEducationalResource[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  filters?: {
    search?: string;
    type?: string;
    uploader?: string;
    school?: string;
    subject?: string;
    educationLevel?: string;
    accessLevel?: string;
    tags?: string[];
  };
  sorting?: {
    sortBy: string;
    sortOrder: string;
  };
}

export interface IResourceStats {
  totalResources: number;
  publishedResources: number;
  unpublishedResources: number;
  totalDownloads: number;
  totalViews: number;
  averageRating: number;
  totalStorage: number;
  totalStorageFormatted: string;
  
  byType: {
    [key in ResourceType]: {
      count: number;
      totalSize: number;
      totalDownloads: number;
    };
  };
  
  byEducationLevel: {
    [key in EducationLevel]: number;
  };
  
  byAccessLevel: {
    [key in AccessLevel]: number;
  };
  
  topUploaders: Array<{
    userId: string;
    userName: string;
    resourceCount: number;
    totalDownloads: number;
  }>;
  
  topResources: Array<{
    id: string;
    name: string;
    downloadCount: number;
    rating: number;
  }>;
  
  recentActivity: Array<{
    type: 'upload' | 'download' | 'comment' | 'rating';
    resourceId: string;
    resourceName: string;
    userId: string;
    userName: string;
    timestamp: Date;
  }>;
}

export interface IResourceFilters {
  search?: string;
  type?: ResourceType | 'all';
  uploader?: string;
  school?: string;
  subject?: string;
  educationLevel?: EducationLevel;
  accessLevel?: AccessLevel;
  isPublished?: boolean;
  tags?: string[];
  minSize?: number;
  maxSize?: number;
  uploadedAfter?: Date;
  uploadedBefore?: Date;
  minRating?: number;
  maxRating?: number;
  page?: number;
  limit?: number;
  sortBy?: 'uploadDate' | 'name' | 'downloadCount' | 'rating' | 'size';
  sortOrder?: 'asc' | 'desc';
}

export interface IUploadResourceRequest {
  name: string;
  description?: string;
  tags?: string[];
  subject?: string;
  educationLevel?: EducationLevel;
  accessLevel: AccessLevel;
  isPublished?: boolean;
}

export interface IUpdateResourceRequest {
  name?: string;
  description?: string;
  tags?: string[];
  subject?: string;
  educationLevel?: EducationLevel;
  accessLevel?: AccessLevel;
  isPublished?: boolean;
}

export interface IResourceCommentRequest {
  content: string;
  rating?: number;
}

export interface IResourceDownloadResponse {
  downloadUrl: string;
  fileName: string;
  fileSize: number;
  expiresAt: Date;
  downloadToken: string;
}

export interface IBulkActionResponse {
  successful: number;
  failed: number;
  total: number;
  results: Array<{
    resourceId: string;
    success: boolean;
    error?: string;
  }>;
  summary: string;
}

// My Resources specific types
export interface IMyResourcesFilters {
  search?: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  type?: ResourceType;
  subject?: string;
  sortBy?: 'uploadDate' | 'name' | 'size' | 'downloads';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}
