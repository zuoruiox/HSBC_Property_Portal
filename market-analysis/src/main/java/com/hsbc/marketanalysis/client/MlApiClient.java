package com.hsbc.marketanalysis.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.hsbc.marketanalysis.dto.PredictionRequest;
import com.hsbc.marketanalysis.dto.PredictionResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
public class MlApiClient {

    private final RestTemplate restTemplate;
    private final ObjectMapper snakeMapper;
    private final String mlApiUrl;

    public MlApiClient(@Value("${ml.api.url:http://localhost:8000}") String mlApiUrl) {
        this.mlApiUrl = mlApiUrl;
        this.restTemplate = new RestTemplate();
        this.snakeMapper = new ObjectMapper();
        this.snakeMapper.setPropertyNamingStrategy(PropertyNamingStrategies.SNAKE_CASE);
    }

    @Cacheable(value = "predictions", key = "#request.hashCode()")
    public PredictionResponse predict(PredictionRequest request) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            String jsonBody = snakeMapper.writeValueAsString(request);
            HttpEntity<String> entity = new HttpEntity<>(jsonBody, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(
                    mlApiUrl + "/predict", entity, String.class);

            JsonNode node = snakeMapper.readTree(response.getBody());
            return new PredictionResponse(node.get("predicted_price").asDouble());
        } catch (Exception e) {
            throw new RuntimeException("ML API call failed: " + e.getMessage(), e);
        }
    }
}
