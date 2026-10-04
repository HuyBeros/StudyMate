package com.huyberos.studymate;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.io.File;
import java.nio.file.Files;
import java.util.List;

@SpringBootApplication
public class StudymateApplication {

	public static void main(String[] args) {
		loadDotEnv();
		SpringApplication.run(StudymateApplication.class, args);
	}

	private static void loadDotEnv() {
		File envFile = new File(".env");
		if (!envFile.exists()) return;
		try {
			List<String> lines = Files.readAllLines(envFile.toPath());
			for (String line : lines) {
				String trimmed = line.trim();
				if (trimmed.isEmpty() || trimmed.startsWith("#") || !trimmed.contains("=")) continue;
				int eqIdx = trimmed.indexOf('=');
				String key = trimmed.substring(0, eqIdx).trim();
				String value = trimmed.substring(eqIdx + 1).trim();
				// Remove quotes if present
				if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
					value = value.substring(1, value.length() - 1);
				}
				if (System.getProperty(key) == null && System.getenv(key) == null) {
					System.setProperty(key, value);
				}
			}
		} catch (Exception ignored) {
		}
	}

}
