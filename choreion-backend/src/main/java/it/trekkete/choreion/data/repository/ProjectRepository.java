package it.trekkete.choreion.data.repository;

import it.trekkete.choreion.data.entity.Project;
import it.trekkete.choreion.data.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findByOwnerOrderByUpdatedAtDesc(User owner);
}
