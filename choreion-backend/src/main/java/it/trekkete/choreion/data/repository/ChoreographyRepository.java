package it.trekkete.choreion.data.repository;

import it.trekkete.choreion.data.entity.Choreography;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ChoreographyRepository extends JpaRepository<Choreography, Long> {
    List<Choreography> findAllByOrderByUpdatedAtDesc();
}

