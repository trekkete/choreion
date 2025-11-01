package it.trekkete.choreion.data.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "people", catalog = "choreion")
@Data
public class Person {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String color;

    private String letter;

    @OneToMany(mappedBy = "person")
    private Set<UserPersonMapping> userMappings = new HashSet<>();
}
