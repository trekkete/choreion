package it.trekkete.choreion.data.entity;


import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "user_person_mappings")
@Data
public class UserPersonMapping {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "person_id", nullable = false)
    private Person person;

    @ManyToOne
    @JoinColumn(name = "choreography_id")
    private Choreography choreography; // Optional: mapping specific to a choreography

    @Column(name = "is_primary")
    private Boolean isPrimary = false; // User's main character
}