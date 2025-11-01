package it.trekkete.choreion.data.service;

import it.trekkete.choreion.data.dto.PersonMappingDTO;
import it.trekkete.choreion.data.entity.Choreography;
import it.trekkete.choreion.data.entity.Person;
import it.trekkete.choreion.data.entity.User;
import it.trekkete.choreion.data.entity.UserPersonMapping;
import it.trekkete.choreion.data.repository.ChoreographyRepository;
import it.trekkete.choreion.data.repository.PersonRepository;
import it.trekkete.choreion.data.repository.UserPersonMappingRepository;
import it.trekkete.choreion.data.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserPersonMappingService {

    @Autowired
    private UserPersonMappingRepository mappingRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PersonRepository personRepository;

    @Autowired
    private ChoreographyRepository choreographyRepository;

    public List<PersonMappingDTO> getUserMappings(Long userId) {
        return mappingRepository.findByUserId(userId).stream()
                                .map(this::toDTO)
                                .collect(Collectors.toList());
    }

    @Transactional
    public PersonMappingDTO createMapping(Long userId, Long personId, Long choreographyId, Boolean isPrimary) {
        User user = userRepository.findById(userId)
                                  .orElseThrow(() -> new RuntimeException("User not found"));
        Person person = personRepository.findById(personId)
                                        .orElseThrow(() -> new RuntimeException("Person not found"));

        // If setting as primary, unset other primary mappings
        if (isPrimary != null && isPrimary) {
            mappingRepository.findByUserIdAndIsPrimaryTrue(userId)
                             .ifPresent(mapping -> {
                                 mapping.setIsPrimary(false);
                                 mappingRepository.save(mapping);
                             });
        }

        UserPersonMapping mapping = new UserPersonMapping();
        mapping.setUser(user);
        mapping.setPerson(person);
        mapping.setIsPrimary(isPrimary != null ? isPrimary : false);

        if (choreographyId != null) {
            Choreography choreography = choreographyRepository.findById(choreographyId)
                                                              .orElseThrow(() -> new RuntimeException("Choreography not found"));
            mapping.setChoreography(choreography);
        }

        UserPersonMapping saved = mappingRepository.save(mapping);
        return toDTO(saved);
    }

    @Transactional
    public void deleteMapping(Long mappingId) {
        mappingRepository.deleteById(mappingId);
    }

    private PersonMappingDTO toDTO(UserPersonMapping mapping) {
        PersonMappingDTO dto = new PersonMappingDTO();
        dto.setId(mapping.getId());
        dto.setPersonId(mapping.getPerson().getId());
        dto.setPersonName(mapping.getPerson().getName());
        dto.setPersonColor(mapping.getPerson().getColor());
        dto.setIsPrimary(mapping.getIsPrimary());

        if (mapping.getChoreography() != null) {
            dto.setChoreographyId(mapping.getChoreography().getId());
            dto.setChoreographyName(mapping.getChoreography().getName());
        }

        return dto;
    }
}