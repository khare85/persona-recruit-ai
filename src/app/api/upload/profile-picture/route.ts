import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Validate file type (images only)
    const allowedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload JPG, PNG, GIF, or WebP images only.' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB for profile pictures)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExtension = file.type.split('/')[1];
    const fileName = `profile_${uuidv4()}.${fileExtension}`;
    
    // Create upload directory structure
    const uploadDir = join(process.cwd(), 'uploads', 'profile-pictures', userId);
    await mkdir(uploadDir, { recursive: true });

    // Save file
    const filePath = join(uploadDir, fileName);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Store file metadata
    const fileMetadata = {
      id: uuidv4(),
      originalName: file.name,
      fileName: fileName,
      filePath: filePath,
      fileSize: file.size,
      fileType: file.type,
      userId: userId,
      uploadedAt: new Date().toISOString(),
      category: 'profile_picture'
    };

    // In production, save metadata to database and update user profile
    console.log('Profile picture uploaded:', fileMetadata);

    return NextResponse.json({
      message: 'Profile picture uploaded successfully',
      fileId: fileMetadata.id,
      originalName: file.name,
      fileName: fileName,
      fileSize: file.size,
      uploadedAt: fileMetadata.uploadedAt,
      imageUrl: `/api/files/${fileMetadata.id}`
    });

  } catch (error) {
    console.error('Profile picture upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload profile picture' },
      { status: 500 }
    );
  }
}