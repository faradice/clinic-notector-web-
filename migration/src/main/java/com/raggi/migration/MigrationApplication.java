package com.raggi.migration;

import com.raggi.migration.service.MigrationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@RequiredArgsConstructor
@Slf4j
public class MigrationApplication implements CommandLineRunner {

    private final MigrationService migrationService;

    public static void main(String[] args) {
        SpringApplication.run(MigrationApplication.class, args);
    }

    @Override
    public void run(String... args) throws Exception {
        log.info("Starting Clinic Notector Music data migration...");

        try {
            migrationService.migrate();
            log.info("Migration completed successfully!");
        } catch (Exception e) {
            log.error("Migration failed: {}", e.getMessage(), e);
            System.exit(1);
        }
    }
}
