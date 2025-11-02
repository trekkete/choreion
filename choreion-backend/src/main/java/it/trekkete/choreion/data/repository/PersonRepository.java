package it.trekkete.choreion.data.repository;

import it.trekkete.choreion.data.entity.Person;
import it.trekkete.choreion.data.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface PersonRepository extends JpaRepository<Person, Long> {
    List<Person> findByProject(Project project);
    Optional<Person> findByIdAndProject(Long id, Project project);
}