FROM docker.1ms.run/library/maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY settings.xml /root/.m2/settings.xml
COPY pom.xml .
RUN mvn dependency:go-offline -B -s /root/.m2/settings.xml
COPY src ./src
RUN mvn clean package -DskipTests -B -s /root/.m2/settings.xml

FROM docker.1ms.run/library/eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8002
ENTRYPOINT ["java", "-jar", "app.jar"]
