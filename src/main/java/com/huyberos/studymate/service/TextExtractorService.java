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

@Slf4j
@Service
public class TextExtractorService {

    public String extractText(MultipartFile file, FileType fileType) {
        if (file == null || file.isEmpty() || fileType == null) {
            return "";
        }

        try (InputStream inputStream = file.getInputStream()) {
            return switch (fileType) {
                case PDF -> extractPdfText(file.getBytes());
                case DOCX -> extractDocxText(inputStream);
                case PPTX -> extractPptxText(inputStream);
            };
        } catch (Exception e) {
            log.error("Failed to extract text from file {}: {}", file.getOriginalFilename(), e.getMessage());
            return "";
        }
    }

    private String extractPdfText(byte[] pdfBytes) {
        try (PDDocument document = Loader.loadPDF(pdfBytes)) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
        } catch (Exception e) {
            log.error("PDFBox extraction error: {}", e.getMessage());
            return "";
        }
    }

    private String extractDocxText(InputStream inputStream) {
        try (XWPFDocument document = new XWPFDocument(inputStream);
             XWPFWordExtractor extractor = new XWPFWordExtractor(document)) {
            return extractor.getText();
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
            return text.toString();
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
