package com.huyberos.studymate.service;

import com.huyberos.studymate.entity.enums.FileType;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xslf.usermodel.XMLSlideShow;
import org.apache.poi.xslf.usermodel.XSLFShape;
import org.apache.poi.xslf.usermodel.XSLFTextShape;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;

@Slf4j
@Service
public class TextExtractorService {

    public String extractText(MultipartFile file, FileType fileType) {
        if (file == null || file.isEmpty()) {
            return "";
        }

        try {
            if (fileType == FileType.PDF) {
                return extractPdfText(file.getBytes());
            } else if (fileType == FileType.DOCX) {
                try (InputStream is = file.getInputStream()) {
                    return extractDocxText(is);
                }
            } else if (fileType == FileType.PPTX) {
                try (InputStream is = file.getInputStream()) {
                    return extractPptxText(is);
                }
            } else {
                // Fallback cho file text / txt / unknown
                String raw = new String(file.getBytes(), StandardCharsets.UTF_8);
                if (!raw.isBlank()) {
                    return raw;
                }
            }
        } catch (Exception e) {
            log.error("Failed to extract text from file {}: {}", file.getOriginalFilename(), e.getMessage());
        }

        // Tạm thời nếu đọc file bị lỗi hoặc text trống, dùng tên file làm nội dung fallback để AI không bị chặn
        return "Tài liệu học tập: " + (file.getOriginalFilename() != null ? file.getOriginalFilename() : "Nội dung học tập");
    }

    private String extractPdfText(byte[] pdfBytes) {
        try (PDDocument document = Loader.loadPDF(pdfBytes)) {
            PDFTextStripper stripper = new PDFTextStripper();
            String text = stripper.getText(document);
            return text != null ? text.trim() : "";
        } catch (Exception e) {
            log.error("PDFBox extraction error: {}", e.getMessage());
            return "";
        }
    }

    private String extractDocxText(InputStream inputStream) {
        try (XWPFDocument document = new XWPFDocument(inputStream);
             XWPFWordExtractor extractor = new XWPFWordExtractor(document)) {
            String text = extractor.getText();
            return text != null ? text.trim() : "";
        } catch (Exception e) {
            log.error("Apache POI DOCX extraction error: {}", e.getMessage());
            return "";
        }
    }

    private String extractPptxText(InputStream inputStream) {
        try (XMLSlideShow ppt = new XMLSlideShow(inputStream)) {
            StringBuilder text = new StringBuilder();
            ppt.getSlides().forEach(slide -> {
                for (XSLFShape shape : slide.getShapes()) {
                    if (shape instanceof XSLFTextShape textShape) {
                        text.append(textShape.getText()).append("\n");
                    }
                }
            });
            return text.toString().trim();
        } catch (Exception e) {
            log.error("Apache POI PPTX extraction error: {}", e.getMessage());
            return "";
        }
    }

    public FileType determineFileType(String filename) {
        if (filename == null) return null;
        String lower = filename.toLowerCase();
        if (lower.endsWith(".pdf")) return FileType.PDF;
        if (lower.endsWith(".docx") || lower.endsWith(".doc")) return FileType.DOCX;
        if (lower.endsWith(".pptx") || lower.endsWith(".ppt")) return FileType.PPTX;
        return null;
    }
}
