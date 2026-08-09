package com.hsbc.marketanalysis.controller;

import com.hsbc.marketanalysis.dto.*;
import com.hsbc.marketanalysis.model.Property;
import com.hsbc.marketanalysis.service.MarketAnalysisService;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class MarketAnalysisController {

    private final MarketAnalysisService service;

    public MarketAnalysisController(MarketAnalysisService service) {
        this.service = service;
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "healthy");
    }

    @GetMapping("/stats")
    public MarketStats getStats() {
        return service.getMarketStats();
    }

    @GetMapping("/price-distribution")
    public Map<String, Object> getPriceDistribution() {
        return service.getPriceDistribution();
    }

    @GetMapping("/price-by-bedrooms")
    public Map<String, Object> getPriceByBedrooms() {
        return service.getPriceByBedrooms();
    }

    @GetMapping("/properties")
    public List<Property> getProperties(
            @RequestParam(required = false) Integer minBedrooms,
            @RequestParam(required = false) Integer maxBedrooms,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(required = false) Double minSchoolRating,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {
        return service.getProperties(minBedrooms, maxBedrooms, minPrice, maxPrice, minSchoolRating, sortBy, sortDir);
    }

    @PostMapping("/predict")
    public PredictionResponse predict(@Valid @RequestBody PredictionRequest request) {
        return service.predict(request);
    }

    @PostMapping("/what-if")
    public List<WhatIfResult> whatIf(@Valid @RequestBody PredictionRequest request) {
        return service.whatIfAnalysis(request);
    }

    @GetMapping("/export/csv")
    public ResponseEntity<String> exportCsv(
            @RequestParam(required = false) Integer minBedrooms,
            @RequestParam(required = false) Integer maxBedrooms,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(required = false) Double minSchoolRating) {
        List<Property> props = service.getProperties(minBedrooms, maxBedrooms, minPrice, maxPrice, minSchoolRating, "id", "asc");
        String csv = service.exportCsv(props);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=properties.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csv);
    }

    @GetMapping("/export/pdf")
    public ResponseEntity<byte[]> exportPdf(
            @RequestParam(required = false) Integer minBedrooms,
            @RequestParam(required = false) Integer maxBedrooms,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(required = false) Double minSchoolRating) {
        List<Property> props = service.getProperties(minBedrooms, maxBedrooms, minPrice, maxPrice, minSchoolRating, "id", "asc");
        byte[] pdf = service.exportPdf(props);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=properties.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }
}
