package it.trekkete.choreion.data.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "roles")
@Data
public class Role {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, unique = true)
    private RoleType name;

    public enum RoleType {
        ROLE_USER,
        ROLE_ADMIN,
        ROLE_CHOREOGRAPHER
    }
}
