package com.hsbc.marketanalysis.dto;

public class MarketStats {
    private long totalProperties;
    private Double avgPrice;
    private Double minPrice;
    private Double maxPrice;
    private Double avgSquareFootage;
    private Double avgPricePerSqFt;
    private Double avgBedrooms;
    private Double avgBathrooms;
    private Double avgSchoolRating;

    public MarketStats() {}

    public long getTotalProperties() { return totalProperties; }
    public void setTotalProperties(long v) { this.totalProperties = v; }
    public Double getAvgPrice() { return avgPrice; }
    public void setAvgPrice(Double v) { this.avgPrice = v; }
    public Double getMinPrice() { return minPrice; }
    public void setMinPrice(Double v) { this.minPrice = v; }
    public Double getMaxPrice() { return maxPrice; }
    public void setMaxPrice(Double v) { this.maxPrice = v; }
    public Double getAvgSquareFootage() { return avgSquareFootage; }
    public void setAvgSquareFootage(Double v) { this.avgSquareFootage = v; }
    public Double getAvgPricePerSqFt() { return avgPricePerSqFt; }
    public void setAvgPricePerSqFt(Double v) { this.avgPricePerSqFt = v; }
    public Double getAvgBedrooms() { return avgBedrooms; }
    public void setAvgBedrooms(Double v) { this.avgBedrooms = v; }
    public Double getAvgBathrooms() { return avgBathrooms; }
    public void setAvgBathrooms(Double v) { this.avgBathrooms = v; }
    public Double getAvgSchoolRating() { return avgSchoolRating; }
    public void setAvgSchoolRating(Double v) { this.avgSchoolRating = v; }
}
