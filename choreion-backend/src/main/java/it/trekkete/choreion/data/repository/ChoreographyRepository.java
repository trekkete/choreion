package it.trekkete.choreion.data.repository;

import it.trekkete.choreion.data.entity.Choreography;
import it.trekkete.choreion.data.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ChoreographyRepository extends JpaRepository<Choreography, Long> {
    List<Choreography> findAllByOrderByUpdatedAtDesc();
    List<Choreography> findByProjectOrderByUpdatedAtDesc(Project project);
    Optional<Choreography> findByIdAndProject(Long id, Project project);
}

