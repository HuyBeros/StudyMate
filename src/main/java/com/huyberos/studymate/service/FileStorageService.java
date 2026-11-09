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
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import javax.imageio.ImageIO;
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

    public String storeAvatar(MultipartFile file) {
        if (file.isEmpty() || file.getSize() > 2 * 1024 * 1024) {
            throw new BadRequestException("Ảnh phải có dung lượng tối đa 2 MB.");
        }
        try (var input = file.getInputStream(); var imageStream = ImageIO.createImageInputStream(input)) {
            if (imageStream == null) throw new BadRequestException("Không đọc được ảnh.");
            var readers = ImageIO.getImageReaders(imageStream);
            if (!readers.hasNext()) throw new BadRequestException("Hãy chọn ảnh JPG hoặc PNG.");
            var reader = readers.next();
            try {
                String format = reader.getFormatName();
                if (!format.equalsIgnoreCase("jpeg") && !format.equalsIgnoreCase("png")) {
                    throw new BadRequestException("Hãy chọn ảnh JPG hoặc PNG.");
                }
                reader.setInput(imageStream, true, true);
                int width = reader.getWidth(0);
                int height = reader.getHeight(0);
                if (width < 1 || height < 1 || width > 4096 || height > 4096) {
                    throw new BadRequestException("Kích thước ảnh tối đa là 4096 × 4096 pixel.");
                }
                double scale = Math.min(1, 512.0 / Math.max(width, height));
                var avatar = new BufferedImage(Math.max(1, (int) (width * scale)),
                        Math.max(1, (int) (height * scale)), BufferedImage.TYPE_INT_ARGB);
                Graphics2D graphics = avatar.createGraphics();
                try {
                    graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
                    graphics.drawImage(reader.read(0), 0, 0, avatar.getWidth(), avatar.getHeight(), null);
                } finally {
                    graphics.dispose();
                }
                String filename = UUID.randomUUID() + ".png";
                Path directory = Files.createDirectories(rootLocation.resolve("avatars"));
                ImageIO.write(avatar, "png", directory.resolve(filename).toFile());
                return "/uploads/avatars/" + filename;
            } finally {
                reader.dispose();
            }
        } catch (IOException ex) {
            throw new BadRequestException("Không đọc hoặc lưu được ảnh. Hãy thử một ảnh JPG hoặc PNG khác.");
        }
    }
}
