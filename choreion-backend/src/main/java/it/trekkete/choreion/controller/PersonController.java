package it.trekkete.choreion.controller;

import it.trekkete.choreion.data.dto.PersonDTO;
import it.trekkete.choreion.data.service.PersonService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/people")
@CrossOrigin(origins = "*")
public class PersonController {

    @Autowired
    private PersonService personService;

    @GetMapping
    @PreAuthorize("hasAnyRole('USER', 'CHOREOGRAPHER', 'ADMIN')")
    public ResponseEntity<List<PersonDTO>> getAllPeople(@RequestParam Long projectId) {
        return ResponseEntity.ok(personService.getAllPeople(projectId));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER', 'CHOREOGRAPHER', 'ADMIN')")
    public ResponseEntity<PersonDTO> getPersonById(
            @PathVariable Long id,
            @RequestParam Long projectId) {
        return ResponseEntity.ok(personService.getPersonById(id, projectId));
    }

    @PostMapping("/bulk")
    @PreAuthorize("hasAnyRole('CHOREOGRAPHER', 'ADMIN')")
    public ResponseEntity<List<PersonDTO>> createPeople(
            @RequestBody List<PersonDTO> personDTOs,
            @RequestParam Long projectId) {
        return ResponseEntity.ok(personService.createPeople(personDTOs, projectId));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('CHOREOGRAPHER', 'ADMIN')")
    public ResponseEntity<PersonDTO> createPerson(
            @RequestBody PersonDTO personDTO,
            @RequestParam Long projectId) {
        return ResponseEntity.ok(personService.createPerson(personDTO, projectId));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('CHOREOGRAPHER', 'ADMIN')")
    public ResponseEntity<PersonDTO> updatePerson(
            @PathVariable Long id,
            @RequestBody PersonDTO personDTO,
            @RequestParam Long projectId) {
        return ResponseEntity.ok(personService.updatePerson(id, personDTO, projectId));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('CHOREOGRAPHER', 'ADMIN')")
    public ResponseEntity<Void> deletePerson(
            @PathVariable Long id,
            @RequestParam Long projectId) {
        personService.deletePerson(id, projectId);
        return ResponseEntity.noContent().build();
    }
}