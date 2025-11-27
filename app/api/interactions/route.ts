// app/api/interactions/route.ts
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('⚠️ Interaction tracking:', body);
    
    // ⭐ 백엔드에 interactions 엔드포인트가 없으므로
    // 프론트엔드에서만 로깅하고 성공 응답 반환
    
    return NextResponse.json(
      { 
        success: true,
        message: 'Interaction logged (frontend only)',
        data: body
      },
      { status: 200 }
    );
    
  } catch (error: any) {
    console.error('Interaction logging error:', error);
    
    // 트래킹 실패해도 UX에 영향 없도록
    return NextResponse.json(
      { 
        success: false,
        message: 'Interaction logging failed (non-critical)',
        error: error.message
      },
      { status: 200 }  // 200 반환 (에러여도 무시)
    );
  }
}