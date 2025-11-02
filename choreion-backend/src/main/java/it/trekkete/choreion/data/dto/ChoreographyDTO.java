package it.trekkete.choreion.data.dto;

import lombok.Data;
import java.util.Map;

@Data
public class ChoreographyDTO {
    private Long id;
    private String name;
    private Integer steps;
    private Map<String, Object> routes;  // Routes will be a nested object
    private java.time.LocalDateTime createdAt;
    private java.time.LocalDateTime updatedAt;
}
