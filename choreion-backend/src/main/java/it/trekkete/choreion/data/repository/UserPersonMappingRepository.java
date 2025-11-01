package it.trekkete.choreion.data.repository;

import it.trekkete.choreion.data.entity.UserPersonMapping;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserPersonMappingRepository extends JpaRepository<UserPersonMapping, Long> {
    List<UserPersonMapping> findByUserId(Long userId);
    List<UserPersonMapping> findByPersonId(Long personId);
    List<UserPersonMapping> findByUserIdAndChoreographyId(Long userId, Long choreographyId);
    Optional<UserPersonMapping> findByUserIdAndPersonIdAndChoreographyId(Long userId, Long personId, Long choreographyId);
    Optional<UserPersonMapping> findByUserIdAndIsPrimaryTrue(Long userId);
}