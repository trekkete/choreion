package it.trekkete.choreion.data.service;

import it.trekkete.choreion.data.dto.PersonDTO;
import it.trekkete.choreion.data.entity.Person;
import it.trekkete.choreion.data.entity.Project;
import it.trekkete.choreion.data.repository.PersonRepository;
import it.trekkete.choreion.data.repository.ProjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PersonService {

    @Autowired
    private PersonRepository personRepository;

    @Autowired
    private ProjectRepository projectRepository;

    public List<PersonDTO> getAllPeople(Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));
        return personRepository.findByProject(project).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public PersonDTO getPersonById(Long id, Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));
        Person person = personRepository.findByIdAndProject(id, project)
                .orElseThrow(() -> new RuntimeException("Person not found"));
        return toDTO(person);
    }

    public List<PersonDTO> createPeople(List<PersonDTO> personDTOs, Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        List<Person> people = personDTOs.stream().map(dto -> {
            Person person = new Person();
            person.setName(dto.getName());
            person.setColor(dto.getColor());
            person.setLetter(dto.getLetter());
            person.setProject(project);
            return person;
        }).collect(Collectors.toList());

        return personRepository.saveAll(people).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public PersonDTO createPerson(PersonDTO personDTO, Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        Person person = new Person();
        person.setName(personDTO.getName());
        person.setColor(personDTO.getColor());
        person.setLetter(personDTO.getLetter());
        person.setProject(project);

        Person saved = personRepository.save(person);
        return toDTO(saved);
    }

    public PersonDTO updatePerson(Long id, PersonDTO personDTO, Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));
        Person person = personRepository.findByIdAndProject(id, project)
                .orElseThrow(() -> new RuntimeException("Person not found"));

        person.setName(personDTO.getName());
        person.setColor(personDTO.getColor());
        person.setLetter(personDTO.getLetter());

        Person updated = personRepository.save(person);
        return toDTO(updated);
    }

    public void deletePerson(Long id, Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));
        Person person = personRepository.findByIdAndProject(id, project)
                .orElseThrow(() -> new RuntimeException("Person not found"));
        personRepository.delete(person);
    }

    private PersonDTO toDTO(Person person) {
        PersonDTO dto = new PersonDTO();
        dto.setId(person.getId());
        dto.setName(person.getName());
        dto.setColor(person.getColor());
        dto.setLetter(person.getLetter());
        return dto;
    }
}

