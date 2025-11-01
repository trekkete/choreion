package it.trekkete.choreion.data.dto;

import lombok.Data;
import java.util.List;

@Data
public class UserDTO {
    private Long id;
    private String username;
    private String email;
    private String fullName;
    private List<String> roles;
    private List<PersonMappingDTO> personMappings;
}