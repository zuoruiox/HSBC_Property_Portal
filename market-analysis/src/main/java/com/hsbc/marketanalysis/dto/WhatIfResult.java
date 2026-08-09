package com.hsbc.marketanalysis.dto;

public class WhatIfResult {
    private String scenario;
    private PredictionRequest features;
    private Double predictedPrice;
    private Double priceDifference;
    private Double percentageChange;

    public WhatIfResult() {}

    public WhatIfResult(String scenario, PredictionRequest features, Double predictedPrice,
                        Double priceDifference, Double percentageChange) {
        this.scenario = scenario;
        this.features = features;
        this.predictedPrice = predictedPrice;
        this.priceDifference = priceDifference;
        this.percentageChange = percentageChange;
    }

    public String getScenario() { return scenario; }
    public void setScenario(String v) { this.scenario = v; }
    public PredictionRequest getFeatures() { return features; }
    public void setFeatures(PredictionRequest v) { this.features = v; }
    public Double getPredictedPrice() { return predictedPrice; }
    public void setPredictedPrice(Double v) { this.predictedPrice = v; }
    public Double getPriceDifference() { return priceDifference; }
    public void setPriceDifference(Double v) { this.priceDifference = v; }
    public Double getPercentageChange() { return percentageChange; }
    public void setPercentageChange(Double v) { this.percentageChange = v; }
}
