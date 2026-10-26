# Multi-stage enterprise build for Spring Boot 4 Java microservice
# Stage 1: Build JAR artifact
FROM maven:3.9.9-eclipse-temurin-17 AS builder
WORKDIR /app

# Cache dependency layer
COPY pom.xml ./
RUN mvn dependency:go-offline -B || true

# Copy sources and package executable fat JAR
COPY src ./src
RUN mvn clean package -DskipTests -B

# Stage 2: Hardened, minimal JRE runtime image
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# Run as non-privileged gearbids user
RUN groupadd -g 1001 gearbids && \
    useradd -u 1001 -g gearbids -s /bin/bash -m gearbids

USER gearbids:gearbids

COPY --chown=gearbids:gearbids --from=builder /app/target/gearbids-auction-service.jar /app/gearbids-auction-service.jar

ENV PORT=5000 \
    SPRING_PROFILES_ACTIVE=prod

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -f http://localhost:${PORT}/health || exit 1

ENTRYPOINT ["java", "-jar", "/app/gearbids-auction-service.jar"]
