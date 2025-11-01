package it.trekkete.choreion.data.dto;

import lombok.Data;
import lombok.AllArgsConstructor;

@Data
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private Long userId;
    private String username;
    private String fullName;
}
