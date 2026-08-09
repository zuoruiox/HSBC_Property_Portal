package com.hsbc.marketanalysis.dto;

public class PredictionResponse {
    private Double predictedPrice;

    public PredictionResponse() {}
    public PredictionResponse(Double predictedPrice) { this.predictedPrice = predictedPrice; }

    public Double getPredictedPrice() { return predictedPrice; }
    public void setPredictedPrice(Double v) { this.predictedPrice = v; }
}
