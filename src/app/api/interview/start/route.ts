import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDefaultElevenLabsConfig } from '@/lib/elevenlabs';

const startInterviewSchema = z.object({
  interviewId: z.string(),
  candidateName: z.string(),
  position: z.string(),
  company: z.string(),
  jobDescription: z.string().optional(),
  duration: z.number().min(5).max(120).default(30) // minutes
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = startInterviewSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data', 
          details: validation.error.errors 
        },
        { status: 400 }
      );
    }

    const { interviewId, candidateName, position, company, jobDescription, duration } = validation.data;

    // Create interview session record
    const interviewSession = {
      id: interviewId,
      candidateName,
      position,
      company,
      jobDescription,
      duration,
      status: 'starting',
      startTime: new Date().toISOString(),
      endTime: null,
      recordingUrl: null,
      transcriptUrl: null,
      analysisUrl: null,
      createdAt: new Date().toISOString()
    };

    // For production, you would:
    // 1. Save interview session to database
    // 2. Initialize ElevenLabs conversation
    // 3. Setup video recording storage
    // 4. Create analysis pipeline

    console.log('Starting interview session:', interviewSession);

    // Return session configuration
    return NextResponse.json({
      success: true,
      data: {
        sessionId: interviewId,
        candidateName,
        position,
        company,
        duration,
        elevenLabsConfig: {
          // In production, use environment variables
          agentId: process.env.ELEVENLABS_AGENT_ID || 'demo-agent',
          // Don't expose API key to client
        },
        recordingConfig: {
          maxDuration: duration * 60, // Convert to seconds
          format: 'webm',
          videoBitrate: 2500000, // 2.5 Mbps
          audioBitrate: 128000   // 128 kbps
        },
        analysisConfig: {
          realTimeTranscription: true,
          emotionAnalysis: true,
          speechPatternAnalysis: true,
          technicalAssessment: position.toLowerCase().includes('engineer') || 
                               position.toLowerCase().includes('developer') ||
                               position.toLowerCase().includes('technical')
        }
      }
    });

  } catch (error) {
    console.error('Start interview API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

// OPTIONS request for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}