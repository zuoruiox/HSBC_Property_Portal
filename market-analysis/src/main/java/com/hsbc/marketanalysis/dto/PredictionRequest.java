package com.hsbc.marketanalysis.dto;

import jakarta.validation.constraints.*;

public class PredictionRequest {
    @NotNull @Positive
    private Double squareFootage;
    @NotNull @Min(0)
    private Integer bedrooms;
    @NotNull @Min(0)
    private Double bathrooms;
    @NotNull @Min(1800) @Max(2026)
    private Integer yearBuilt;
    @NotNull @Positive
    private Double lotSize;
    @NotNull @Min(0)
    private Double distanceToCityCenter;
    @NotNull @Min(0) @Max(10)
    private Double schoolRating;

    public PredictionRequest() {}

    public PredictionRequest(Double squareFootage, Integer bedrooms, Double bathrooms,
                             Integer yearBuilt, Double lotSize, Double distanceToCityCenter,
                             Double schoolRating) {
        this.squareFootage = squareFootage;
        this.bedrooms = bedrooms;
        this.bathrooms = bathrooms;
        this.yearBuilt = yearBuilt;
        this.lotSize = lotSize;
        this.distanceToCityCenter = distanceToCityCenter;
        this.schoolRating = schoolRating;
    }

    public Double getSquareFootage() { return squareFootage; }
    public void setSquareFootage(Double v) { this.squareFootage = v; }
    public Integer getBedrooms() { return bedrooms; }
    public void setBedrooms(Integer v) { this.bedrooms = v; }
    public Double getBathrooms() { return bathrooms; }
    public void setBathrooms(Double v) { this.bathrooms = v; }
    public Integer getYearBuilt() { return yearBuilt; }
    public void setYearBuilt(Integer v) { this.yearBuilt = v; }
    public Double getLotSize() { return lotSize; }
    public void setLotSize(Double v) { this.lotSize = v; }
    public Double getDistanceToCityCenter() { return distanceToCityCenter; }
    public void setDistanceToCityCenter(Double v) { this.distanceToCityCenter = v; }
    public Double getSchoolRating() { return schoolRating; }
    public void setSchoolRating(Double v) { this.schoolRating = v; }
}
