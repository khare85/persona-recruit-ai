import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Mock video storage - in production, use cloud storage
const mockVideoStorage = new Map<string, {
  id: string;
  videoUrl: string;
  transcriptUrl: string;
  duration: string;
  uploadedAt: string;
  fileSize: number;
  format: string;
}>();

// Initialize with demo data
mockVideoStorage.set('demo-interview-001', {
  id: 'demo-interview-001',
  videoUrl: '/api/placeholder/video/interview-demo.webm',
  transcriptUrl: '/api/placeholder/transcript/interview-demo.json',
  duration: '31:45',
  uploadedAt: new Date().toISOString(),
  fileSize: 157000000, // ~157MB
  format: 'webm'
});

// GET /api/interview/video/[id] - Get video file or metadata
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'metadata';

    const videoData = mockVideoStorage.get(id);
    
    if (!videoData) {
      return NextResponse.json(
        { error: 'Interview video not found' },
        { status: 404 }
      );
    }

    if (format === 'metadata') {
      // Return video metadata
      return NextResponse.json({
        success: true,
        data: videoData
      });
    } else if (format === 'stream') {
      // In production, this would stream the video file
      // For now, redirect to placeholder or return video URL
      return NextResponse.json({
        success: true,
        data: {
          streamUrl: videoData.videoUrl,
          format: videoData.format
        }
      });
    }

    return NextResponse.json(
      { error: 'Invalid format parameter' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Video API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/interview/video/[id] - Upload video recording
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const formData = await request.formData();
    const videoFile = formData.get('video') as File;
    const transcriptData = formData.get('transcript') as string;

    if (!videoFile) {
      return NextResponse.json(
        { error: 'No video file provided' },
        { status: 400 }
      );
    }

    // In production, upload to cloud storage (AWS S3, Google Cloud Storage, etc.)
    const uploadResult = {
      id,
      videoUrl: `/api/interviews/${id}/video.webm`,
      transcriptUrl: `/api/interviews/${id}/transcript.json`,
      duration: '31:45', // Would calculate from video
      uploadedAt: new Date().toISOString(),
      fileSize: videoFile.size,
      format: videoFile.type.split('/')[1]
    };

    // Store in mock storage
    mockVideoStorage.set(id, uploadResult);

    // Process transcript if provided
    if (transcriptData) {
      try {
        const transcript = JSON.parse(transcriptData);
        // Store transcript data
        console.log('Transcript received:', transcript);
      } catch (error) {
        console.error('Invalid transcript data:', error);
      }
    }

    return NextResponse.json({
      success: true,
      data: uploadResult,
      message: 'Video and transcript uploaded successfully'
    });

  } catch (error) {
    console.error('Video upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload video' },
      { status: 500 }
    );
  }
}