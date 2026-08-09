package com.hsbc.marketanalysis.model;

public class Property {
    private Long id;
    private Double squareFootage;
    private Integer bedrooms;
    private Double bathrooms;
    private Integer yearBuilt;
    private Double lotSize;
    private Double distanceToCityCenter;
    private Double schoolRating;
    private Double price;

    public Property() {}

    public Property(Long id, Double squareFootage, Integer bedrooms, Double bathrooms,
                    Integer yearBuilt, Double lotSize, Double distanceToCityCenter,
                    Double schoolRating, Double price) {
        this.id = id;
        this.squareFootage = squareFootage;
        this.bedrooms = bedrooms;
        this.bathrooms = bathrooms;
        this.yearBuilt = yearBuilt;
        this.lotSize = lotSize;
        this.distanceToCityCenter = distanceToCityCenter;
        this.schoolRating = schoolRating;
        this.price = price;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Double getSquareFootage() { return squareFootage; }
    public void setSquareFootage(Double squareFootage) { this.squareFootage = squareFootage; }
    public Integer getBedrooms() { return bedrooms; }
    public void setBedrooms(Integer bedrooms) { this.bedrooms = bedrooms; }
    public Double getBathrooms() { return bathrooms; }
    public void setBathrooms(Double bathrooms) { this.bathrooms = bathrooms; }
    public Integer getYearBuilt() { return yearBuilt; }
    public void setYearBuilt(Integer yearBuilt) { this.yearBuilt = yearBuilt; }
    public Double getLotSize() { return lotSize; }
    public void setLotSize(Double lotSize) { this.lotSize = lotSize; }
    public Double getDistanceToCityCenter() { return distanceToCityCenter; }
    public void setDistanceToCityCenter(Double distanceToCityCenter) { this.distanceToCityCenter = distanceToCityCenter; }
    public Double getSchoolRating() { return schoolRating; }
    public void setSchoolRating(Double schoolRating) { this.schoolRating = schoolRating; }
    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }
}
