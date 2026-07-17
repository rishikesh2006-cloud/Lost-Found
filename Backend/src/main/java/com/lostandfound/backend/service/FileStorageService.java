package com.lostandfound.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Service
public class FileStorageService {

    private final String uploadDir = "./files";

    public FileStorageService() {
        // Create upload directory if it doesn't exist
        File dir = new File(uploadDir);
        if (!dir.exists()) {
            dir.mkdirs();
        }
    }

    public String storeFile(MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            return null;
        }

        // Generate a unique suffix using timestamp
        String uniqueSuffix = String.valueOf(System.currentTimeMillis());
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) {
            originalFilename = "unnamed.png";
        }
        // Clean original filename of spaces or special characters
        originalFilename = originalFilename.replaceAll("\\s+", "_");
        String filename = uniqueSuffix + originalFilename;

        Path targetPath = Paths.get(uploadDir).resolve(filename);
        Files.copy(file.getInputStream(), targetPath);

        return filename;
    }
}
