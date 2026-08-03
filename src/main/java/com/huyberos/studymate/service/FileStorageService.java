package com.huyberos.studymate.service;

import com.huyberos.studymate.exception.BadRequestException;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Objects;
import java.util.UUID;

@Slf4j
@Service
public class FileStorageService {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    private Path rootLocation;

    @PostConstruct
    public void init() {
        try {
            this.rootLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(this.rootLocation);
            log.info("File upload directory initialized at: {}", this.rootLocation);
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize upload storage location", e);
        }
    }

    /**
     * Lưu file upload vào thư mục local và trả về relative URL/path.
     */
    public String storeFile(MultipartFile file, String subFolder) {
        String originalFilename = StringUtils.cleanPath(Objects.requireNonNull(file.getOriginalFilename()));

        if (file.isEmpty()) {
            throw new BadRequestException("Failed to store empty file " + originalFilename);
        }
        if (originalFilename.contains("..")) {
            throw new BadRequestException("Cannot store file with relative path outside current directory " + originalFilename);
        }

        try {
            String extension = "";
            int i = originalFilename.lastIndexOf('.');
            if (i > 0) {
                extension = originalFilename.substring(i);
            }

            String storedFileName = UUID.randomUUID() + extension;
            Path destinationFolder = this.rootLocation.resolve(subFolder);
            Files.createDirectories(destinationFolder);

            Path destinationFile = destinationFolder.resolve(storedFileName);

            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, destinationFile, StandardCopyOption.REPLACE_EXISTING);
            }

            // Trả về URL path dạng /uploads/subFolder/filename
            return "/uploads/" + subFolder + "/" + storedFileName;

        } catch (IOException e) {
            log.error("Failed to store file {}", originalFilename, e);
            throw new RuntimeException("Failed to store file " + originalFilename, e);
        }
    }

    public Path getRootLocation() {
        return rootLocation;
    }
}
