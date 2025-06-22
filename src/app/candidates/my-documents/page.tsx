'use client';

import { useState } from 'react';
import { Container } from '@/components/shared/Container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  FileText, 
  Upload, 
  Download, 
  Trash2, 
  Eye, 
  FileIcon, 
  FolderOpen, 
  ArrowLeft,
  FilePlus,
  FileCheck,
  FileX,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { getMockDocumentsForCandidate } from '@/services/mockDataService';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

// For demo, assume we're viewing candidate ID 1 (Sarah Johnson)
const DEMO_CANDIDATE_ID = '1';

export default function MyDocumentsPage() {
  const documents = getMockDocumentsForCandidate(DEMO_CANDIDATE_ID);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return <FileText className="h-4 w-4 text-red-500" />;
    if (fileType.includes('word')) return <FileText className="h-4 w-4 text-blue-500" />;
    if (fileType.includes('presentation')) return <FileText className="h-4 w-4 text-orange-500" />;
    if (fileType.includes('zip')) return <FolderOpen className="h-4 w-4 text-purple-500" />;
    return <FileIcon className="h-4 w-4 text-gray-500" />;
  };

  const getFileTypeBadge = (fileType: string) => {
    if (fileType.includes('pdf')) return 'PDF';
    if (fileType.includes('word')) return 'DOCX';
    if (fileType.includes('presentation')) return 'PPTX';
    if (fileType.includes('zip')) return 'ZIP';
    return 'FILE';
  };

  const formatFileSize = (bytes: number = 1024000) => {
    // Mock file sizes for demo
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleUpload = () => {
    setIsUploading(true);
    // Simulate upload
    setTimeout(() => {
      setIsUploading(false);
      toast({
        title: "Document uploaded",
        description: "Your document has been uploaded successfully.",
        action: <FileCheck className="text-green-500" />,
      });
    }, 2000);
  };

  return (
    <Container className="max-w-6xl">
      <div className="mb-8">
        <Link href="/candidates/dashboard" passHref>
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-3xl font-headline font-bold text-foreground">My Documents</h1>
        <p className="text-muted-foreground">Manage your resumes, certificates, and other professional documents</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documents.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Resumes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {documents.filter(d => d.name.toLowerCase().includes('resume')).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Certificates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {documents.filter(d => d.name.toLowerCase().includes('certif')).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12.5 MB</div>
          </CardContent>
        </Card>
      </div>

      {/* Upload Section */}
      <Card className="mb-8 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <Upload className="mr-2 h-5 w-5 text-primary" />
            Upload New Document
          </CardTitle>
          <CardDescription>Add your resume, certificates, or other professional documents</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="document-upload">Select Document</Label>
              <Input 
                id="document-upload" 
                type="file" 
                accept=".pdf,.doc,.docx,.ppt,.pptx,.zip"
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Supported formats: PDF, DOC, DOCX, PPT, PPTX, ZIP (Max 10MB)
              </p>
            </div>
            <div>
              <Label htmlFor="document-type">Document Type</Label>
              <select 
                id="document-type" 
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                <option value="resume">Resume</option>
                <option value="cover-letter">Cover Letter</option>
                <option value="certificate">Certificate</option>
                <option value="portfolio">Portfolio</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <Button 
            className="mt-4" 
            onClick={handleUpload}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Upload className="mr-2 h-4 w-4 animate-pulse" />
                Uploading...
              </>
            ) : (
              <>
                <FilePlus className="mr-2 h-4 w-4" />
                Upload Document
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <FolderOpen className="mr-2 h-5 w-5 text-primary" />
            Your Documents
          </CardTitle>
          <CardDescription>All your uploaded professional documents</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Upload Date</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getFileIcon(doc.fileType)}
                      <div>
                        <div className="font-medium">{doc.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {doc.name.includes('Resume') && 'Primary resume'}
                          {doc.name.includes('Certificate') && 'Professional certification'}
                          {doc.name.includes('CoverLetter') && 'Cover letter template'}
                          {doc.name.includes('Portfolio') && 'Work samples'}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getFileTypeBadge(doc.fileType)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(doc.uploadDate), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    {formatFileSize()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          toast({
                            title: "Opening document",
                            description: `${doc.name} will open in a new tab.`,
                          });
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          toast({
                            title: "Download started",
                            description: `${doc.name} is downloading.`,
                          });
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          toast({
                            variant: "destructive",
                            title: "Document deleted",
                            description: `${doc.name} has been removed.`,
                          });
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {documents.length === 0 && (
            <div className="text-center py-8">
              <FileX className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No documents uploaded yet.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Start by uploading your resume or certificates.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tips Section */}
      <Card className="mt-8 bg-accent/10 border-accent">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <AlertCircle className="mr-2 h-5 w-5 text-accent" />
            Document Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Keep your resume updated with your latest experience and skills</li>
            <li>• Upload relevant certificates to showcase your qualifications</li>
            <li>• Use PDF format for better compatibility across systems</li>
            <li>• Name your files clearly (e.g., "John_Doe_Resume_2024.pdf")</li>
            <li>• Remove outdated documents to keep your profile organized</li>
          </ul>
        </CardContent>
      </Card>
    </Container>
  );
}