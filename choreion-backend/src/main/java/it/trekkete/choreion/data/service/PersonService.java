package it.trekkete.choreion.data.service;

import it.trekkete.choreion.data.entity.Person;
import it.trekkete.choreion.data.repository.PersonRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class PersonService {

    @Autowired
    private PersonRepository personRepository;

    public List<Person> getAllPeople() {
        return personRepository.findAll();
    }

    public Person getPersonById(Long id) {
        return personRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Person not found"));
    }

    public Person createPerson(Person person) {
        return personRepository.save(person);
    }

    public Person updatePerson(Long id, Person personDetails) {
        Person person = getPersonById(id);
        person.setName(personDetails.getName());
        person.setColor(personDetails.getColor());
        person.setStartX(personDetails.getStartX());
        person.setStartY(personDetails.getStartY());
        return personRepository.save(person);
    }

    public void deletePerson(Long id) {
        personRepository.deleteById(id);
    }
}

