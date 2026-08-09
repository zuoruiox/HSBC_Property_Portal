package com.hsbc.marketanalysis.client;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.hsbc.marketanalysis.dto.PredictionRequest;
import com.hsbc.marketanalysis.dto.PredictionResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Component
public class MlApiClient {

    private final RestClient restClient;
    private final ObjectMapper camelMapper = new ObjectMapper();
    private final ObjectMapper snakeMapper = new ObjectMapper();

    public MlApiClient(@Value("${ml.api.url:http://localhost:8000}") String mlApiUrl) {
        this.snakeMapper.setPropertyNamingStrategy(PropertyNamingStrategies.SNAKE_CASE);
        this.restClient = RestClient.builder()
                .baseUrl(mlApiUrl)
                .build();
    }

    @Cacheable(value = "predictions", key = "#request.hashCode()")
    public PredictionResponse predict(PredictionRequest request) {
        try {
            // Convert request to snake_case map
            Map<String, Object> snakeBody = snakeMapper.convertValue(request, new TypeReference<>() {});

            String jsonResponse = restClient.post()
                    .uri("/predict")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(snakeBody)
                    .retrieve()
                    .body(String.class);

            // Parse snake_case response
            JsonNode node = snakeMapper.readTree(jsonResponse);
            return new PredictionResponse(node.get("predicted_price").asDouble());
        } catch (Exception e) {
            throw new RuntimeException("ML API call failed: " + e.getMessage(), e);
        }
    }
}
