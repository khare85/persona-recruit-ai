# Database and Storage Setup Guide

## Overview
This document outlines the complete database indexes and cloud storage folder structure for the AI Talent Recruitment Platform.

## Database Deployment
All required Firestore indexes (composite and vector) and security rules for both Firestore and Storage are defined in the project.

To deploy all database configurations, use the provided script:
```bash
npm run deploy:db
```
This script is the recommended way to ensure your database is correctly configured for production. It handles the deployment of:
- Firestore Security Rules (`firestore.rules`)
- Storage Security Rules (`storage.rules`)
- All Firestore Indexes (`firestore.indexes.json`), including:
  - Composite indexes for efficient querying.
  - **Vector indexes** for AI-powered semantic search.

## Storage Folder Structure

### User Content Storage

```
/image/{userId}/
├── profile.jpg                    # Profile pictures (5MB max)
├── avatar.png                     # User avatars
└── portfolio/                     # Portfolio images

/document/{userId}/
├── resume.pdf                     # Resume files (10MB max)
├── cover-letter.pdf               # Cover letters
├── certificates/                  # Certifications
└── references.pdf                 # Reference documents

/resume/{userId}/
├── current.pdf                    # Current resume
├── versions/                      # Resume versions
│   ├── v1.pdf
│   ├── v2.pdf
│   └── v3.pdf
└── tailored/                      # Job-specific resumes
    ├── {jobId}.pdf
    └── {companyId}.pdf
```

### Video Content Storage

```
/videos/
├── intro/{userId}/                # Video introductions (100MB max)
│   ├── introduction.mp4
│   └── pitch.mp4
├── interview/{userId}/            # Interview recordings (500MB max)
│   ├── {interviewId}.mp4
│   └── feedback.mp4
├── testimonial/{userId}/          # Video testimonials (50MB max)
│   └── testimonial.mp4
└── thumbnails/{userId}/           # Video thumbnails (2MB max)
    ├── intro-thumb.jpg
    └── interview-thumb.jpg
```

### Company Storage

```
/companies/{companyId}/
├── logo/                          # Company logos (5MB max)
│   ├── primary.png
│   ├── secondary.png
│   └── favicon.ico
├── banners/                       # Company banners (10MB max)
│   ├── header.jpg
│   ├── career-page.jpg
│   └── social-media.jpg
├── documents/                     # Company documents (20MB max)
│   ├── handbook.pdf
│   ├── benefits.pdf
│   └── policies/
│       ├── privacy.pdf
│       └── terms.pdf
└── branding/                      # Brand assets
    ├── colors.json
    ├── fonts.json
    └── guidelines.pdf
```

### Job-Related Storage

```
/jobs/{jobId}/
├── attachments/                   # Job attachments (10MB max)
│   ├── job-description.pdf
│   ├── requirements.pdf
│   └── company-info.pdf
└── media/
    ├── office-photos/
    └── team-videos/
```

### Application Storage

```
/applications/{applicationId}/
├── attachments/                   # Application attachments (10MB max)
│   ├── custom-resume.pdf
│   ├── portfolio.pdf
│   └── writing-samples/
├── assessments/                   # Assessment submissions
│   ├── coding-challenge.zip
│   └── design-portfolio.pdf
└── feedback/                      # Interview feedback files
    └── notes.pdf
```

### System Storage

```
/system/
├── backups/                       # System backups
│   ├── daily/
│   ├── weekly/
│   └── monthly/
├── templates/                     # Document templates
│   ├── job-templates/
│   ├── email-templates/
│   └── contract-templates/
├── exports/                       # Data exports
│   ├── user-data/
│   └── analytics/
└── logs/                          # System logs
    ├── audit/
    └── errors/
```

### Temporary Storage

```
/temp/{userId}/
├── uploads/                       # Temporary uploads (24h TTL)
├── processing/                    # Files being processed
└── cache/                         # Cached content
```

## File Size Limits

| File Type | Max Size | Use Case |
|-----------|----------|----------|
| Profile Images | 5MB | User avatars, company logos |
| Documents | 10MB | Resumes, job descriptions |
| Large Documents | 20MB | Company handbooks, portfolios |
| Video Thumbnails | 2MB | Video preview images |
| Video Content | 50-100MB | Introductions, testimonials |
| Interview Videos | 500MB | Full interview recordings |

## Content Types

### Allowed Image Types
- `image/jpeg`
- `image/png`
- `image/gif`
- `image/webp`

### Allowed Document Types
- `application/pdf`
- `application/msword`
- `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- `text/plain`

### Allowed Video Types
- `video/mp4`
- `video/webm`
- `video/quicktime`

## Monitoring and Maintenance

### Performance Monitoring
- Monitor index usage via Firebase Console
- Track query performance metrics
- Set up alerts for slow queries

### Storage Monitoring
- Monitor storage usage and costs
- Set up lifecycle policies for old files
- Implement automated cleanup for temp files

### Security Monitoring
- Review security rule violations
- Monitor unauthorized access attempts
- Regular security rule audits

## Backup Strategy

### Automated Backups
- Daily Firestore exports to Cloud Storage
- Weekly full database snapshots
- Monthly archive to cold storage

### File Backup
- Daily sync of critical user files
- Version control for important documents
- Geographic replication for disaster recovery

## Performance Optimization

### Query Optimization
- Use composite indexes for complex queries
- Implement pagination for large datasets
- Cache frequently accessed data

### Storage Optimization
- Implement CDN for file delivery
- Compress images and videos
- Use appropriate file formats

### Cost Optimization
- Monitor and optimize index usage
- Implement data retention policies
- Use storage classes effectively

## Troubleshooting

### Common Index Issues
- Missing composite indexes
- Incorrect field ordering
- Query pattern mismatches

### Storage Issues
- File upload failures
- Permission errors
- Size limit violations

### Performance Issues
- Slow query performance
- High storage costs
- Security rule conflicts
