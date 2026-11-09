FROM node:22-bookworm-slim AS frontend
WORKDIR /build/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/index.html frontend/vite.config.js ./
COPY frontend/public/ ./public/
COPY frontend/src/ ./src/
RUN VITE_API_BASE_URL=/api node node_modules/vite/bin/vite.js build

FROM maven:3.9-eclipse-temurin-21 AS backend
WORKDIR /build
COPY pom.xml ./
COPY src/main/ ./src/main/
COPY --from=frontend /build/frontend/dist/ ./src/main/resources/static/
RUN mvn -B -Dmaven.test.skip=true package

FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
COPY --from=backend /build/target/studymate-*.jar /app/studymate.jar
ENV SPRING_JPA_SHOW_SQL=false \
    LOGGING_LEVEL_ORG_HIBERNATE_SQL=WARN \
    LOGGING_LEVEL_COM_HUYBEROS_STUDYMATE=INFO \
    SERVER_ERROR_INCLUDE_MESSAGE=never \
    SERVER_ERROR_INCLUDE_BINDING_ERRORS=never
CMD ["sh", "-c", ": \"${DB_URL:?Set DB_URL}\" \"${JWT_SECRET:?Set JWT_SECRET}\"; exec java -jar /app/studymate.jar"]
