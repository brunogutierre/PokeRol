# syntax=docker/dockerfile:1

# ---- Build: compile and package the Spring Boot jar ----------------------------
FROM docker.io/library/eclipse-temurin:25-jdk AS build
WORKDIR /workspace

# Dependencies first, so they stay in a cached layer while only sources change.
COPY .mvn .mvn
COPY mvnw pom.xml ./
RUN ./mvnw -B -q dependency:go-offline

COPY src src
RUN ./mvnw -B -q package -DskipTests \
    && cp target/pokerol-api-*.jar application.jar \
    && java -Djarmode=tools -jar application.jar extract --layers --destination extracted

# ---- Runtime: JRE only, layered jar, non-root user ------------------------------
FROM docker.io/library/eclipse-temurin:25-jre
WORKDIR /application

RUN groupadd --system spring && useradd --system --gid spring --no-create-home spring

# Least to most frequently changing layers: dependencies rarely change, our code often.
COPY --from=build /workspace/extracted/dependencies/ ./
COPY --from=build /workspace/extracted/spring-boot-loader/ ./
COPY --from=build /workspace/extracted/snapshot-dependencies/ ./
COPY --from=build /workspace/extracted/application/ ./

# AOT cache training run (JDK 25, JEP 514/515): start the context, record loaded and
# linked classes plus method profiles, exit before the web server starts (no network).
# Same GC as production (Render sets -XX:+UseSerialGC), so the cache is accepted there.
RUN java -XX:+UseSerialGC -XX:AOTCacheOutput=application.aot -Dspring.context.exit=onRefresh \
    -jar application.jar

USER spring
EXPOSE 8080
# Render injects PORT; server.port=${PORT:8080}. Extra JVM flags come from JAVA_TOOL_OPTIONS.
ENTRYPOINT ["java", "-XX:AOTCache=application.aot", "-jar", "application.jar"]
