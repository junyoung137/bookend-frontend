import jsPDF from 'jspdf';
import { Packer, Document, Paragraph, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import { Chapter } from '@/types/editor';

interface ExportOptions {
  title: string;
  chapters: Chapter[];
  selectedChapters: string[];
  format: 'pdf' | 'word' | 'markdown';
  includeMetadata: boolean;
}

// HTML 콘텐츠 정제
const cleanContent = (html: string): string => {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.innerText || div.textContent || '';
};

// 메타데이터 생성
const generateMetadata = (title: string, chapters: Chapter[]) => {
  const now = new Date();
  const dateStr = now.toLocaleDateString('ko-KR');
  const timeStr = now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  
  const totalWords = chapters.reduce((sum, ch) => {
    return sum + ch.sections.reduce((sSum, s) => {
      const content = cleanContent(s.content);
      return sSum + content.replace(/\s+/g, '').length;
    }, 0);
  }, 0);
  
  return {
    title,
    date: dateStr,
    time: timeStr,
    chapterCount: chapters.length,
    wordCount: totalWords
  };
};

// PDF 내보내기 (한글 지원)
export const exportToPDF = async (options: ExportOptions): Promise<void> => {
  const { title, chapters, selectedChapters, includeMetadata } = options;
  
  const selectedChaptersData = chapters.filter(ch => selectedChapters.includes(ch.id));
  
  if (selectedChaptersData.length === 0) {
    throw new Error('선택된 챕터가 없습니다.');
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  const lineHeight = 7;
  
  let yPosition = margin;
  
  const addNewPageIfNeeded = (requiredSpace: number = 15) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };
  
  // 제목 페이지
  doc.setFontSize(24);
  doc.text(title, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 20;
  
  // 메타데이터
  if (includeMetadata) {
    const metadata = generateMetadata(title, selectedChaptersData);
    
    doc.setFontSize(10);
    doc.text(`Created: ${metadata.date} ${metadata.time}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += lineHeight;
    doc.text(`Chapters: ${metadata.chapterCount} | Words: ${metadata.wordCount}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;
  }
  
  // 목차
  doc.addPage();
  yPosition = margin;
  
  doc.setFontSize(18);
  doc.text('Table of Contents', margin, yPosition);
  yPosition += 12;
  
  doc.setFontSize(11);
  selectedChaptersData.forEach((chapter, index) => {
    addNewPageIfNeeded();
    doc.text(`${index + 1}. ${chapter.title}`, margin + 5, yPosition);
    yPosition += lineHeight;
  });
  
  // 본문
  selectedChaptersData.forEach((chapter, chapterIndex) => {
    doc.addPage();
    yPosition = margin;
    
    // 챕터 제목
    doc.setFontSize(16);
    const chapterTitle = `${chapterIndex + 1}. ${chapter.title}`;
    const titleLines = doc.splitTextToSize(chapterTitle, contentWidth);
    
    titleLines.forEach((line: string) => {
      doc.text(line, margin, yPosition);
      yPosition += 10;
    });
    
    yPosition += 8;
    
    // 섹션 콘텐츠
    doc.setFontSize(11);
    
    chapter.sections.forEach((section, sectionIndex) => {
      const content = cleanContent(section.content);
      if (!content.trim()) return;
      
      const paragraphs = content.split(/\n\n+/);
      
      paragraphs.forEach((paragraph) => {
        if (!paragraph.trim()) return;
        
        const lines = doc.splitTextToSize(paragraph.trim(), contentWidth);
        
        lines.forEach((line: string) => {
          addNewPageIfNeeded();
          doc.text(line, margin, yPosition);
          yPosition += lineHeight;
        });
        
        yPosition += 4; // 단락 간격
      });
      
      if (sectionIndex < chapter.sections.length - 1) {
        yPosition += 6; // 섹션 간격
      }
    });
  });
  
  // PDF 다운로드
  doc.save(`${sanitizeFilename(title)}.pdf`);
};

// Word 내보내기
export const exportToWord = async (options: ExportOptions): Promise<void> => {
  const { title, chapters, selectedChapters, includeMetadata } = options;
  
  const selectedChaptersData = chapters.filter(ch => selectedChapters.includes(ch.id));
  
  if (selectedChaptersData.length === 0) {
    throw new Error('선택된 챕터가 없습니다.');
  }
  
  const metadata = generateMetadata(title, selectedChaptersData);
  const docChildren = [];
  
  // 제목 페이지
  docChildren.push(
    new Paragraph({
      text: title,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    })
  );
  
  if (includeMetadata) {
    docChildren.push(
      new Paragraph({
        text: `작성일: ${metadata.date} ${metadata.time}`,
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
      }),
      new Paragraph({
        text: `총 챕터: ${metadata.chapterCount}개 | 총 글자 수: ${metadata.wordCount}자`,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      })
    );
  }
  
  // 목차
  docChildren.push(
    new Paragraph({
      text: '목차',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
    })
  );
  
  selectedChaptersData.forEach((chapter, index) => {
    docChildren.push(
      new Paragraph({
        text: `${index + 1}. ${chapter.title}`,
        spacing: { after: 100 },
      })
    );
  });
  
  // 페이지 구분
  docChildren.push(
    new Paragraph({
      text: '',
      spacing: { after: 400 },
    })
  );
  
  // 본문
  selectedChaptersData.forEach((chapter, chapterIndex) => {
    // 챕터 제목
    docChildren.push(
      new Paragraph({
        text: `${chapterIndex + 1}. ${chapter.title}`,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      })
    );
    
    // 섹션 콘텐츠
    chapter.sections.forEach((section) => {
      const content = cleanContent(section.content);
      if (!content.trim()) return;
      
      const paragraphs = content.split(/\n\n+/);
      
      paragraphs.forEach((paragraph) => {
        if (!paragraph.trim()) return;
        
        docChildren.push(
          new Paragraph({
            text: paragraph.trim(),
            spacing: { after: 200 },
          })
        );
      });
    });
    
    // 챕터 간 공백
    if (chapterIndex < selectedChaptersData.length - 1) {
      docChildren.push(
        new Paragraph({
          text: '',
          spacing: { after: 200 },
        })
      );
    }
  });
  
  const doc = new Document({
    sections: [{
      properties: {},
      children: docChildren,
    }],
  });
  
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${sanitizeFilename(title)}.docx`);
};

// Markdown 내보내기
export const exportToMarkdown = (options: ExportOptions): void => {
  const { title, chapters, selectedChapters, includeMetadata } = options;
  
  const selectedChaptersData = chapters.filter(ch => selectedChapters.includes(ch.id));
  
  if (selectedChaptersData.length === 0) {
    throw new Error('선택된 챕터가 없습니다.');
  }
  
  const metadata = generateMetadata(title, selectedChaptersData);
  
  let markdown = `# ${title}\n\n`;
  
  if (includeMetadata) {
    markdown += `**작성일:** ${metadata.date} ${metadata.time}  \n`;
    markdown += `**총 챕터:** ${metadata.chapterCount}개  \n`;
    markdown += `**총 글자 수:** ${metadata.wordCount}자\n\n`;
    markdown += `---\n\n`;
  }
  
  // 목차
  markdown += `## 목차\n\n`;
  selectedChaptersData.forEach((chapter, index) => {
    const anchor = chapter.title
      .toLowerCase()
      .replace(/[^a-z0-9가-힣\s-]/g, '')
      .replace(/\s+/g, '-');
    markdown += `${index + 1}. [${chapter.title}](#${anchor})\n`;
  });
  markdown += `\n---\n\n`;
  
  // 본문
  selectedChaptersData.forEach((chapter, chapterIndex) => {
    markdown += `## ${chapterIndex + 1}. ${chapter.title}\n\n`;
    
    chapter.sections.forEach((section) => {
      const content = cleanContent(section.content);
      if (!content.trim()) return;
      
      const paragraphs = content.split(/\n\n+/);
      
      paragraphs.forEach((paragraph) => {
        if (!paragraph.trim()) return;
        markdown += `${paragraph.trim()}\n\n`;
      });
    });
    
    if (chapterIndex < selectedChaptersData.length - 1) {
      markdown += `\n---\n\n`;
    }
  });
  
  // Markdown 파일 다운로드
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  saveAs(blob, `${sanitizeFilename(title)}.md`);
};

// 파일명 정제
const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[<>:"/\\|?*]/g, '') // 금지된 문자 제거
    .replace(/\s+/g, '_') // 공백을 언더스코어로
    .substring(0, 200); // 최대 길이 제한
};

// 통합 내보내기 함수
export const handleExport = async (options: ExportOptions): Promise<void> => {
  if (!options.title.trim()) {
    throw new Error('제목을 입력해주세요.');
  }
  
  if (options.selectedChapters.length === 0) {
    throw new Error('최소 1개 이상의 챕터를 선택해주세요.');
  }

  try {
    switch (options.format) {
      case 'pdf':
        await exportToPDF(options);
        break;
      case 'word':
        await exportToWord(options);
        break;
      case 'markdown':
        exportToMarkdown(options);
        break;
      default:
        throw new Error('지원하지 않는 형식입니다.');
    }
  } catch (error) {
    console.error('내보내기 실패:', error);
    throw error;
  }
};