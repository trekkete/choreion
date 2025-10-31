package it.trekkete.choreion.data.entity;

import jakarta.persistence.*;
import lombok.Data;

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

    @Column(name = "start_x")
    private Integer startX;

    @Column(name = "start_y")
    private Integer startY;
}
