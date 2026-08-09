package com.hsbc.marketanalysis.service;

import com.hsbc.marketanalysis.client.MlApiClient;
import com.hsbc.marketanalysis.dto.*;
import com.hsbc.marketanalysis.model.Property;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class MarketAnalysisService {

    private final DataLoaderService dataLoader;
    private final MlApiClient mlApiClient;

    public MarketAnalysisService(DataLoaderService dataLoader, MlApiClient mlApiClient) {
        this.dataLoader = dataLoader;
        this.mlApiClient = mlApiClient;
    }

    @Cacheable("marketStats")
    public MarketStats getMarketStats() {
        List<Property> props = dataLoader.getProperties();
        MarketStats stats = new MarketStats();
        stats.setTotalProperties(props.size());
        stats.setAvgPrice(props.stream().mapToDouble(Property::getPrice).average().orElse(0));
        stats.setMinPrice(props.stream().mapToDouble(Property::getPrice).min().orElse(0));
        stats.setMaxPrice(props.stream().mapToDouble(Property::getPrice).max().orElse(0));
        stats.setAvgSquareFootage(props.stream().mapToDouble(Property::getSquareFootage).average().orElse(0));
        stats.setAvgPricePerSqFt(props.stream().mapToDouble(p -> p.getPrice() / p.getSquareFootage()).average().orElse(0));
        stats.setAvgBedrooms(props.stream().mapToDouble(Property::getBedrooms).average().orElse(0));
        stats.setAvgBathrooms(props.stream().mapToDouble(Property::getBathrooms).average().orElse(0));
        stats.setAvgSchoolRating(props.stream().mapToDouble(Property::getSchoolRating).average().orElse(0));
        return stats;
    }

    @Cacheable("priceDistribution")
    public Map<String, Object> getPriceDistribution() {
        List<Property> props = dataLoader.getProperties();
        Map<String, Long> distribution = new LinkedHashMap<>();
        distribution.put("0-200k", props.stream().filter(p -> p.getPrice() < 200000).count());
        distribution.put("200k-300k", props.stream().filter(p -> p.getPrice() >= 200000 && p.getPrice() < 300000).count());
        distribution.put("300k-400k", props.stream().filter(p -> p.getPrice() >= 300000 && p.getPrice() < 400000).count());
        distribution.put("400k+", props.stream().filter(p -> p.getPrice() >= 400000).count());
        return Map.of("distribution", distribution, "labels", distribution.keySet());
    }

    public List<Property> getProperties(Integer minBedrooms, Integer maxBedrooms,
                                         Double minPrice, Double maxPrice,
                                         Double minSchoolRating, String sortBy, String sortDir) {
        List<Property> props = new ArrayList<>(dataLoader.getProperties());

        if (minBedrooms != null) props = props.stream().filter(p -> p.getBedrooms() >= minBedrooms).collect(Collectors.toList());
        if (maxBedrooms != null) props = props.stream().filter(p -> p.getBedrooms() <= maxBedrooms).collect(Collectors.toList());
        if (minPrice != null) props = props.stream().filter(p -> p.getPrice() >= minPrice).collect(Collectors.toList());
        if (maxPrice != null) props = props.stream().filter(p -> p.getPrice() <= maxPrice).collect(Collectors.toList());
        if (minSchoolRating != null) props = props.stream().filter(p -> p.getSchoolRating() >= minSchoolRating).collect(Collectors.toList());

        Comparator<Property> comparator = switch (sortBy != null ? sortBy : "id") {
            case "price" -> Comparator.comparing(Property::getPrice);
            case "squareFootage" -> Comparator.comparing(Property::getSquareFootage);
            case "yearBuilt" -> Comparator.comparing(Property::getYearBuilt);
            case "schoolRating" -> Comparator.comparing(Property::getSchoolRating);
            default -> Comparator.comparing(Property::getId);
        };

        if ("desc".equalsIgnoreCase(sortDir)) comparator = comparator.reversed();
        props.sort(comparator);
        return props;
    }

    @Cacheable("priceByBedrooms")
    public Map<String, Object> getPriceByBedrooms() {
        Map<Integer, Double> avgByBedrooms = dataLoader.getProperties().stream()
                .collect(Collectors.groupingBy(Property::getBedrooms,
                        Collectors.averagingDouble(Property::getPrice)));
        return Map.of("data", avgByBedrooms);
    }

    public PredictionResponse predict(PredictionRequest request) {
        return mlApiClient.predict(request);
    }

    public List<WhatIfResult> whatIfAnalysis(PredictionRequest baseRequest) {
        List<WhatIfResult> results = new ArrayList<>();
        PredictionResponse basePrediction = mlApiClient.predict(baseRequest);
        double basePrice = basePrediction.getPredictedPrice();

        results.add(new WhatIfResult("Base Scenario", baseRequest, basePrice, 0.0, 0.0));

        // Scenario: +200 sqft
        PredictionRequest r1 = copyRequest(baseRequest);
        r1.setSquareFootage(r1.getSquareFootage() + 200);
        double p1 = mlApiClient.predict(r1).getPredictedPrice();
        results.add(new WhatIfResult("Add 200 sqft", r1, p1, p1 - basePrice, ((p1 - basePrice) / basePrice) * 100));

        // Scenario: +1 bedroom
        PredictionRequest r2 = copyRequest(baseRequest);
        r2.setBedrooms(r2.getBedrooms() + 1);
        double p2 = mlApiClient.predict(r2).getPredictedPrice();
        results.add(new WhatIfResult("Add 1 bedroom", r2, p2, p2 - basePrice, ((p2 - basePrice) / basePrice) * 100));

        // Scenario: +1 bathroom
        PredictionRequest r3 = copyRequest(baseRequest);
        r3.setBathrooms(r3.getBathrooms() + 1);
        double p3 = mlApiClient.predict(r3).getPredictedPrice();
        results.add(new WhatIfResult("Add 1 bathroom", r3, p3, p3 - basePrice, ((p3 - basePrice) / basePrice) * 100));

        // Scenario: school rating +1
        PredictionRequest r4 = copyRequest(baseRequest);
        r4.setSchoolRating(Math.min(10, r4.getSchoolRating() + 1));
        double p4 = mlApiClient.predict(r4).getPredictedPrice();
        results.add(new WhatIfResult("School rating +1", r4, p4, p4 - basePrice, ((p4 - basePrice) / basePrice) * 100));

        // Scenario: 1 mile closer to city
        PredictionRequest r5 = copyRequest(baseRequest);
        r5.setDistanceToCityCenter(Math.max(0, r5.getDistanceToCityCenter() - 1));
        double p5 = mlApiClient.predict(r5).getPredictedPrice();
        results.add(new WhatIfResult("1 mile closer to city", r5, p5, p5 - basePrice, ((p5 - basePrice) / basePrice) * 100));

        return results;
    }

    private PredictionRequest copyRequest(PredictionRequest r) {
        return new PredictionRequest(
                r.getSquareFootage(), r.getBedrooms(), r.getBathrooms(),
                r.getYearBuilt(), r.getLotSize(), r.getDistanceToCityCenter(), r.getSchoolRating()
        );
    }

    public String exportCsv(List<Property> properties) {
        StringBuilder sb = new StringBuilder();
        sb.append("id,square_footage,bedrooms,bathrooms,year_built,lot_size,distance_to_city_center,school_rating,price\n");
        for (Property p : properties) {
            sb.append(String.format("%d,%.0f,%d,%.1f,%d,%.0f,%.1f,%.1f,%.0f%n",
                    p.getId(), p.getSquareFootage(), p.getBedrooms(), p.getBathrooms(),
                    p.getYearBuilt(), p.getLotSize(), p.getDistanceToCityCenter(),
                    p.getSchoolRating(), p.getPrice()));
        }
        return sb.toString();
    }
}
