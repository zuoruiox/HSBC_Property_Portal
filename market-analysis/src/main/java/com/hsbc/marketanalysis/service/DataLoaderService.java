package com.hsbc.marketanalysis.service;

import com.hsbc.marketanalysis.model.Property;
import jakarta.annotation.PostConstruct;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.*;
import java.util.ArrayList;
import java.util.List;

@Service
public class DataLoaderService {

    private List<Property> properties = new ArrayList<>();

    @PostConstruct
    public void loadData() {
        boolean loaded = loadFromClasspath();
        if (!loaded) {
            loadFromExternalPath();
        }
    }

    private boolean loadFromClasspath() {
        try {
            var resource = new ClassPathResource("data/House Price Dataset.csv");
            return loadFromInputStream(resource.getInputStream());
        } catch (Exception e) {
            return false;
        }
    }

    private void loadFromExternalPath() {
        String[] paths = {
                "data/House Price Dataset.csv",
                "src/main/resources/data/House Price Dataset.csv",
        };
        for (String path : paths) {
            try (FileInputStream fis = new FileInputStream(path)) {
                loadFromInputStream(fis);
                return;
            } catch (Exception ignored) {}
        }
        throw new RuntimeException("Failed to load property data from any location");
    }

    private boolean loadFromInputStream(InputStream is) throws IOException {
        // Wrap in BOMInputStream-like handling using PushbackInputStream
        PushbackInputStream pis = new PushbackInputStream(is, 4);
        byte[] bom = new byte[4];
        int read = pis.read(bom, 0, 4);
        int skip = 0;
        if (read >= 3 && bom[0] == (byte)0xEF && bom[1] == (byte)0xBB && bom[2] == (byte)0xBF) {
            skip = 3; // UTF-8 BOM
        }
        if (skip > 0) {
            pis.unread(bom, skip, read - skip);
        } else if (read > 0) {
            pis.unread(bom, 0, read);
        }

        Reader reader = new InputStreamReader(pis);
        CSVFormat format = CSVFormat.DEFAULT.builder()
                .setHeader()
                .setSkipHeaderRecord(true)
                .build();
        CSVParser parser = new CSVParser(reader, format);

        List<Property> loaded = new ArrayList<>();
        for (CSVRecord record : parser) {
            Property p = new Property();
            p.setId(Long.parseLong(getValue(record, "id")));
            p.setSquareFootage(Double.parseDouble(getValue(record, "square_footage")));
            p.setBedrooms(Integer.parseInt(getValue(record, "bedrooms")));
            p.setBathrooms(Double.parseDouble(getValue(record, "bathrooms")));
            p.setYearBuilt(Integer.parseInt(getValue(record, "year_built")));
            p.setLotSize(Double.parseDouble(getValue(record, "lot_size")));
            p.setDistanceToCityCenter(Double.parseDouble(getValue(record, "distance_to_city_center")));
            p.setSchoolRating(Double.parseDouble(getValue(record, "school_rating")));
            p.setPrice(Double.parseDouble(getValue(record, "price")));
            loaded.add(p);
        }
        parser.close();
        reader.close();
        this.properties = loaded;
        return !loaded.isEmpty();
    }

    private String getValue(CSVRecord record, String key) {
        String value = record.get(key);
        if (value != null) {
            value = value.replace("\uFEFF", "").trim();
        }
        return value;
    }

    public List<Property> getProperties() {
        return properties;
    }
}
