// app/api/health/route.ts
import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function GET() {
  try {
    // ✅ /api/v1/health → /health
    const response = await fetch(`${BACKEND_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(`Backend health check failed: ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json({
      frontend: 'healthy',
      backend: data,
      timestamp: new Date().toISOString(),
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      {
        frontend: 'healthy',
        backend: 'unhealthy',
        error: error.message,
        backend_url: BACKEND_URL,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}