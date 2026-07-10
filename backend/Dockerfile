# Build stage — use Temurin JDK + the project's Gradle wrapper so it builds on
# any architecture (the old gradle:8.5-jdk17-alpine image has no arm64 variant).
FROM eclipse-temurin:17-jdk AS build

WORKDIR /app

# Gradle wrapper + build config first (better layer caching)
COPY gradlew settings.gradle build.gradle ./
COPY gradle ./gradle
RUN chmod +x gradlew

# Source, then build the boot jar
COPY src ./src
RUN ./gradlew bootJar --no-daemon

FROM eclipse-temurin:17-jre

WORKDIR /app

# wget for the healthcheck (not in the base Ubuntu JRE image)
RUN apt-get update && apt-get install -y --no-install-recommends wget && rm -rf /var/lib/apt/lists/*

# Copy JAR from build stage
COPY --from=build /app/build/libs/*.jar app.jar

# Expose port
EXPOSE 8080

# Health check (app runs under context-path /api)
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/actuator/health || exit 1

# Run application
ENTRYPOINT ["java", "-jar", "app.jar"]
