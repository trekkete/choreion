package it.trekkete.choreion.data.dto;

import lombok.Data;

@Data
public class ChoreographySummaryDTO {
    private Long id;
    private String name;
    private Integer steps;
    private java.time.LocalDateTime createdAt;
    private java.time.LocalDateTime updatedAt;
}