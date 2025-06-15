
"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Container } from '@/components/shared/Container';
import { FileText, UploadCloud, Eye, Download, Trash2, PlusCircle, FolderOpen } from 'lucide-react';
import Link from 'next/link';

// Mock data for documents
const mockDocuments = [
  { id: 'doc1', name: 'NDA - Tech Solutions Inc.pdf', type: 'NDA', dateUploaded: '2024-07-15', status: 'Signed' },
  { id: 'doc2', name: 'ID Verification - Driver License.jpg', type: 'Verification', dateUploaded: '2024-07-10', status: 'Approved' },
  { id: 'doc3', name: 'Offer Letter - Innovate LLC.pdf', type: 'Offer Letter', dateUploaded: '2024-06-20', status: 'Accepted' },
  { id: 'doc4', name: 'Work Sample - Portfolio Piece.zip', type: 'Work Sample', dateUploaded: '2024-07-01', status: 'Submitted' },
];

export default function CandidateDocumentsPage() {
  return (
    <Container>
      <div className="mb-8">
        <h1 className="text-3xl font-headline font-semibold text-foreground flex items-center">
          <FolderOpen className="mr-3 h-8 w-8 text-primary" />
          My Documents
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your uploaded documents, such as NDAs, identification, offer letters, and work samples.
        </p>
      </div>

      <Card className="shadow-xl">
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle className="text-xl">Uploaded Documents</CardTitle>
            <CardDescription>View and manage your documents shared with recruiters or companies.</CardDescription>
          </div>
          <Button>
            <UploadCloud className="mr-2 h-4 w-4" /> Upload New Document
          </Button>
        </CardHeader>
        <CardContent>
          {mockDocuments.length > 0 ? (
            <div className="space-y-4">
              {mockDocuments.map((doc) => (
                <Card key={doc.id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-muted/30 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-primary flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-md">{doc.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        Type: {doc.type} | Uploaded: {doc.dateUploaded} | Status: <span className={`font-medium ${doc.status === 'Approved' || doc.status === 'Signed' ? 'text-green-600' : 'text-amber-600'}`}>{doc.status}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2 self-start sm:self-center mt-2 sm:mt-0">
                    <Button variant="outline" size="sm"><Eye className="mr-1 h-4 w-4" /> View</Button>
                    <Button variant="outline" size="sm"><Download className="mr-1 h-4 w-4" /> Download</Button>
                    <Button variant="destructive" size="sm" className="hidden sm:inline-flex"><Trash2 className="mr-1 h-4 w-4" /> Delete</Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">You haven't uploaded any documents yet.</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground">
            Documents uploaded here may be shared with companies you apply to, as per your consent.
        </CardFooter>
      </Card>
      
      <div className="mt-8 text-center">
        <Link href="/candidates/dashboard" passHref>
            <Button variant="outline">&larr; Back to Dashboard</Button>
        </Link>
      </div>
    </Container>
  );
}
