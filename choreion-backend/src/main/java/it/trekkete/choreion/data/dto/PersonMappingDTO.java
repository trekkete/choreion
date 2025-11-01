package it.trekkete.choreion.data.dto;

import lombok.Data;

@Data
public class PersonMappingDTO {
    private Long id;
    private Long personId;
    private String personName;
    private String personColor;
    private Long choreographyId;
    private String choreographyName;
    private Boolean isPrimary;
}
