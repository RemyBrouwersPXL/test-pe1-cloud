package com.gearbids.auction.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

public class Vehicle {
    private Integer id;
    private String vin;
    private Integer year;
    private String make;
    private String model;
    private String trim;
    private Integer mileage;
    private String transmission;
    private String drivetrain;
    private String engine;
    @JsonProperty("exterior_color")
    private String exteriorColor;
    @JsonProperty("interior_color")
    private String interiorColor;
    @JsonProperty("body_style")
    private String bodyStyle;
    private List<String> highlights = new ArrayList<>();
    private List<String> equipment = new ArrayList<>();
    private List<String> modifications = new ArrayList<>();
    @JsonProperty("known_flaws")
    private List<String> knownFlaws = new ArrayList<>();
    @JsonProperty("created_at")
    private OffsetDateTime createdAt;

    public Vehicle() {}

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getVin() { return vin; }
    public void setVin(String vin) { this.vin = vin; }

    public Integer getYear() { return year; }
    public void setYear(Integer year) { this.year = year; }

    public String getMake() { return make; }
    public void setMake(String make) { this.make = make; }

    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }

    public String getTrim() { return trim; }
    public void setTrim(String trim) { this.trim = trim; }

    public Integer getMileage() { return mileage; }
    public void setMileage(Integer mileage) { this.mileage = mileage; }

    public String getTransmission() { return transmission; }
    public void setTransmission(String transmission) { this.transmission = transmission; }

    public String getDrivetrain() { return drivetrain; }
    public void setDrivetrain(String drivetrain) { this.drivetrain = drivetrain; }

    public String getEngine() { return engine; }
    public void setEngine(String engine) { this.engine = engine; }

    public String getExteriorColor() { return exteriorColor; }
    public void setExteriorColor(String exteriorColor) { this.exteriorColor = exteriorColor; }

    public String getInteriorColor() { return interiorColor; }
    public void setInteriorColor(String interiorColor) { this.interiorColor = interiorColor; }

    public String getBodyStyle() { return bodyStyle; }
    public void setBodyStyle(String bodyStyle) { this.bodyStyle = bodyStyle; }

    public List<String> getHighlights() { return highlights; }
    public void setHighlights(List<String> highlights) { this.highlights = highlights != null ? highlights : new ArrayList<>(); }

    public List<String> getEquipment() { return equipment; }
    public void setEquipment(List<String> equipment) { this.equipment = equipment != null ? equipment : new ArrayList<>(); }

    public List<String> getModifications() { return modifications; }
    public void setModifications(List<String> modifications) { this.modifications = modifications != null ? modifications : new ArrayList<>(); }

    public List<String> getKnownFlaws() { return knownFlaws; }
    public void setKnownFlaws(List<String> knownFlaws) { this.knownFlaws = knownFlaws != null ? knownFlaws : new ArrayList<>(); }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
